// 游戏主类
class Game {
    constructor() {
        // PIXI应用
        this.app = new PIXI.Application({
            width: CONFIG.CANVAS_WIDTH,
            height: CONFIG.CANVAS_HEIGHT,
            backgroundColor: CONFIG.BACKGROUND_COLOR,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: false,
        });

        // 添加到DOM
        document.getElementById('game-container').insertBefore(
            this.app.view,
            document.getElementById('ui-overlay')
        );

        // 游戏状态
        this.state = GAME_STATE.MENU;
        this.previousState = null;

        // 容器
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);

        // 图层
        this.groundLayer = new PIXI.Container();
        this.itemLayer = new PIXI.Container();
        this.enemyLayer = new PIXI.Container();
        this.playerLayer = new PIXI.Container();
        this.bulletLayer = new PIXI.Container();
        this.effectLayer = new PIXI.Container();

        this.worldContainer.addChild(this.groundLayer);
        this.worldContainer.addChild(this.itemLayer);
        this.worldContainer.addChild(this.enemyLayer);
        this.worldContainer.addChild(this.playerLayer);
        this.worldContainer.addChild(this.bulletLayer);
        this.worldContainer.addChild(this.effectLayer);

        // 系统
        this.input = new InputManager();
        this.camera = new Camera();
        this.player = new Player(this.playerLayer);
        this.weaponSystem = new WeaponSystem(this);
        this.waveSystem = new WaveSystem(this);
        this.items = new ItemSystem(this);
        this.collision = new CollisionSystem(this);

        // 对象池
        this.bullets = [];
        this.enemies = [];
        this.bosses = [];
        this.particles = new ParticlePool(this.effectLayer);

        // UI系统
        this.hud = new HUD(this);
        this.menu = new MenuSystem(this);
        this.shop = new ShopSystem(this);
        this.levelUp = new LevelUpUI(this);

        // 游戏计时器
        this.gameTime = 0;
        this.lastTime = Date.now();

        // 初始化
        this.init();
    }

    // 初始化游戏
    init() {
        // 绘制地面
        this.drawGround();

        // 显示主菜单
        this.menu.showMainMenu();

        // 开始游戏循环
        this.app.ticker.add(this.update.bind(this));
    }

    // 绘制地面
    drawGround() {
        const ground = new PIXI.Graphics();

        // 背景
        ground.beginFill(0x2a2a3a);
        ground.drawRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
        ground.endFill();

        // 网格线
        ground.lineStyle(1, 0x3a3a4a, 0.3);
        const gridSize = 100;
        for (let x = 0; x < CONFIG.WORLD_WIDTH; x += gridSize) {
            ground.moveTo(x, 0);
            ground.lineTo(x, CONFIG.WORLD_HEIGHT);
        }
        for (let y = 0; y < CONFIG.WORLD_HEIGHT; y += gridSize) {
            ground.moveTo(0, y);
            ground.lineTo(CONFIG.WORLD_WIDTH, y);
        }

        // 边界高亮
        ground.lineStyle(4, 0x4a4a6a);
        ground.drawRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);

        this.groundLayer.addChild(ground);
    }

    // 游戏主循环
    update() {
        const now = Date.now();
        const delta = (now - this.lastTime) / 16.67; // 标准化到60fps
        this.lastTime = now;

        // 更新输入
        this.input.update();

        // 根据状态更新
        switch (this.state) {
            case GAME_STATE.PLAYING:
                this.updatePlaying(delta);
                break;
            case GAME_STATE.SHOP:
                this.shop.update(delta);
                break;
        }

        // 检查暂停
        if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.SHOP) {
            if (this.input.isPausePressed()) {
                this.pauseGame();
            }
        }
    }

    // 游戏中更新
    updatePlaying(delta) {
        this.gameTime += delta * 16.67;

        // 更新玩家
        this.player.update(delta, this.input, this.camera);

        // 更新摄像机
        this.camera.follow(this.player);
        this.camera.update(delta);
        this.camera.applyTo(this.worldContainer);

        // 更新武器系统
        this.weaponSystem.update(delta, this.player, this.enemies, this.bosses);

        // 更新波次系统
        this.waveSystem.update(delta, this.player.x, this.player.y);

        // 更新敌人
        this.updateEnemies(delta);

        // 更新Boss
        this.updateBosses(delta);

        // 更新子弹
        this.updateBullets(delta);

        // 更新粒子
        this.particles.update(delta);

        // 更新掉落物
        this.items.update(delta, this.player);

        // 碰撞检测
        this.collision.update(delta, this.player, this.enemies, this.bosses, this.bullets);

        // 更新角色被动技能
        if (this.menu.characterSystem) {
            this.menu.characterSystem.updatePassive(this.player);
        }

        // 更新HUD
        this.hud.update(this.player, this.waveSystem.getWaveInfo(), this.getActiveEnemyCount());

        // 检查玩家死亡
        if (!this.player.alive) {
            this.gameOver();
        }
    }

    // 更新敌人
    updateEnemies(delta) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.active) continue;

            const result = enemy.update(delta, this.player.x, this.player.y, this.enemies);

            // 自爆处理
            if (result === 'explode') {
                this.handleEnemyExplosion(enemy);
                this.removeEnemy(enemy, i);
            }

            // 检查边界
            if (enemy.x < -100 || enemy.x > CONFIG.WORLD_WIDTH + 100 ||
                enemy.y < -100 || enemy.y > CONFIG.WORLD_HEIGHT + 100) {
                this.removeEnemy(enemy, i);
            }
        }
    }

    // 更新Boss
    updateBosses(delta) {
        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const boss = this.bosses[i];
            if (!boss.active) continue;

            const result = boss.update(delta, this.player.x, this.player.y, this);

            // Boss技能处理
            if (result === 'summon') {
                this.handleBossSummon(boss);
            } else if (result === 'chargeImpact') {
                this.handleBossChargeImpact(boss);
            } else if (result === 'slam') {
                this.handleBossSlam(boss);
            }
        }
    }

    // 更新子弹
    updateBullets(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.active) {
                this.removeBullet(bullet, i);
                continue;
            }

            bullet.update(delta);

            if (!bullet.active) {
                this.removeBullet(bullet, i);
            }
        }
    }

    // 创建子弹
    createBullet(x, y, angle, config) {
        // 找一个非活跃的子弹或创建新的
        let bullet = this.bullets.find(b => !b.active);
        if (!bullet) {
            bullet = new Projectile(this.bulletLayer, false);
            this.bullets.push(bullet);
        }

        bullet.init(x, y, angle, config, this.player.damageMultiplier);
        return bullet;
    }

    // 创建敌人子弹
    createEnemyBullet(x, y, angle, config) {
        let bullet = this.bullets.find(b => !b.active);
        if (!bullet) {
            bullet = new Projectile(this.bulletLayer, true);
            this.bullets.push(bullet);
        }

        bullet.init(x, y, angle, config);
        bullet.isEnemy = true;
        return bullet;
    }

    // 创建敌人
    createEnemy(type, x, y, waveMultiplier) {
        // 找一个非活跃的敌人或创建新的
        let enemy = this.enemies.find(e => !e.active);
        if (!enemy) {
            enemy = new Enemy(this.enemyLayer);
            this.enemies.push(enemy);
        }

        enemy.init(type, x, y, waveMultiplier);
        return enemy;
    }

    // 创建Boss
    createBoss(type, x, y, waveMultiplier) {
        let boss = this.bosses.find(b => !b.active);
        if (!boss) {
            boss = new Boss(this.enemyLayer);
            this.bosses.push(boss);
        }

        boss.init(type, x, y, waveMultiplier);
        return boss;
    }

    // 对敌人造成伤害
    damageEnemy(target, damage, knockbackX = 0, knockbackY = 0) {
        const killed = target.takeDamage(damage, knockbackX, knockbackY);

        if (killed) {
            // 掉落物品
            this.onEnemyKill(target);
        }

        return killed;
    }

    // 敌人死亡处理
    onEnemyKill(enemy) {
        // 掉落经验
        this.items.createXPOrb(enemy.x, enemy.y, enemy.xpValue);

        // 掉落金币
        if (Math.random() < 0.3) {
            this.items.createGoldDrop(enemy.x, enemy.y, MathUtils.randomInt(1, 5));
        }

        // 掉落生命恢复
        if (Math.random() < 0.1) {
            this.items.createHealthDrop(enemy.x, enemy.y, 10);
        }

        // 死亡粒子
        this.particles.emit(enemy.x, enemy.y, 10, 0xFFFFFF, 4, 500);

        // 更新统计
        this.player.stats.kills++;
        this.player.stats.wave = this.waveSystem.currentWave;
    }

    // 移除敌人
    removeEnemy(enemy, index) {
        enemy.reset();
        // 不从数组中移除，只是重置以便复用
    }

    // 移除子弹
    removeBullet(bullet, index) {
        bullet.reset();
    }

    // 处理敌人自爆
    handleEnemyExplosion(enemy) {
        // 创建爆炸粒子
        this.particles.emit(enemy.x, enemy.y, 20, 0xFF6347, 6, 600);

        // 对范围内造成伤害
        const dist = MathUtils.distance(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist < enemy.explosionRadius) {
            this.player.takeDamage(enemy.damage);
            this.camera.shake(10, 200);
        }

        // 对范围内其他敌人造成伤害
        for (const other of this.enemies) {
            if (other === enemy || !other.active) continue;
            const otherDist = MathUtils.distance(enemy.x, enemy.y, other.x, other.y);
            if (otherDist < enemy.explosionRadius) {
                other.takeDamage(enemy.damage * 0.5);
            }
        }
    }

    // Boss召唤小怪
    handleBossSummon(boss) {
        const summonCount = boss.summonCount || 3;
        for (let i = 0; i < summonCount; i++) {
            const angle = (Math.PI * 2 / summonCount) * i;
            const x = boss.x + Math.cos(angle) * 80;
            const y = boss.y + Math.sin(angle) * 80;
            this.createEnemy('FAST', x, y, 1 + (this.waveSystem.currentWave - 1) * 0.1);
        }
        this.particles.emit(boss.x, boss.y, 15, 0xFFD700, 5, 500);
    }

    // Boss冲锋碰撞
    handleBossChargeImpact(boss) {
        this.particles.emit(boss.x, boss.y, 25, 0xFF4500, 8, 700);
        this.camera.shake(15, 300);

        // 对范围内造成伤害
        const dist = MathUtils.distance(boss.x, boss.y, this.player.x, this.player.y);
        if (dist < boss.size * 2) {
            this.player.takeDamage(boss.damage * 1.5);
        }
    }

    // Boss地面重击
    handleBossSlam(boss) {
        this.particles.emit(boss.x, boss.y, 30, 0x8B4513, 6, 600);
        this.camera.shake(12, 250);

        // 创建冲击波
        const shockwave = new PIXI.Graphics();
        shockwave.lineStyle(4, 0x8B4513, 0.5);
        shockwave.drawCircle(0, 0, boss.size * 2);
        shockwave.x = boss.x;
        shockwave.y = boss.y;
        this.effectLayer.addChild(shockwave);

        // 冲击波动画
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            shockwave.scale.set(scale);
            shockwave.alpha -= 0.05;
            if (shockwave.alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                this.effectLayer.removeChild(shockwave);
            }
        };
        animate();

        // 对范围内造成伤害
        const dist = MathUtils.distance(boss.x, boss.y, this.player.x, this.player.y);
        if (dist < boss.size * 3) {
            this.player.takeDamage(boss.damage);
        }
    }

    // 创建闪电效果
    createLightning(x1, y1, x2, y2, branches = []) {
        const lightning = new LightningEffect(this.effectLayer);
        lightning.create(x1, y1, x2, y2, branches);
        // 自动清理
        setTimeout(() => {
            lightning.reset();
        }, 300);
    }

    // 波次完成
    onWaveComplete(waveNumber) {
        // 更新统计
        this.player.stats.wave = waveNumber;

        // 检查完美波次
        if (this.player.stats.damageTaken === 0) {
            this.player.stats.perfectWave = true;
        }

        // 检查速通
        if (waveNumber >= 5 && this.gameTime < 300000) { // 5分钟
            this.player.stats.speedRun = true;
        }

        // 打开商店
        this.openShop();
    }

    // 打开商店
    openShop() {
        this.state = GAME_STATE.SHOP;
        this.shop.open(this.player);
        this.hud.hide();
    }

    // 关闭商店
    closeShop() {
        this.shop.close();
        this.state = GAME_STATE.PLAYING;
        this.hud.show();

        // 开始下一波
        this.startNextWave();
    }

    // 开始下一波
    startNextWave() {
        const nextWave = this.waveSystem.currentWave + 1;

        // 检查游戏是否胜利
        if (nextWave > CONFIG.WAVES.TOTAL_WAVES) {
            this.gameWin();
            return;
        }

        this.waveSystem.startWave(nextWave);
    }

    // 开始游戏
    startGame() {
        // 重置游戏状态
        this.resetGame();

        // 应用角色属性
        const charSystem = this.menu.characterSystem;
        if (charSystem.getSelected()) {
            charSystem.applyToPlayer(this.player);
            this.player.equipWeapon(charSystem.getSelected().startWeapon);
        } else {
            this.player.equipWeapon('PISTOL');
        }

        // 切换状态
        this.state = GAME_STATE.PLAYING;

        // 隐藏菜单
        this.menu.hideAll();

        // 显示HUD
        this.hud.show();

        // 开始第一波
        this.waveSystem.startWave(1);

        // 重置摄像机
        this.camera.reset();
    }

    // 暂停游戏
    pauseGame() {
        if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.SHOP) return;

        this.previousState = this.state;
        this.state = GAME_STATE.PAUSED;
        this.menu.showPauseMenu();
    }

    // 继续游戏
    resumeGame() {
        this.menu.hidePauseMenu();
        this.state = this.previousState || GAME_STATE.PLAYING;
    }

    // 游戏结束
    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        this.hud.hide();
        this.menu.showGameOver(this.player.stats);
    }

    // 游戏胜利
    gameWin() {
        // 简化处理：显示游戏结束
        this.gameOver();
    }

    // 退出到菜单
    quitToMenu() {
        this.state = GAME_STATE.MENU;
        this.menu.hideAll();
        this.menu.showMainMenu();
        this.hud.hide();
        this.resetGame();
    }

    // 重置游戏
    resetGame() {
        // 重置玩家
        this.player.reset();

        // 重置系统
        this.waveSystem.reset();
        this.items.reset();
        this.shop.reset();
        this.levelUp.reset();
        this.collision.reset();

        // 清理敌人
        for (const enemy of this.enemies) {
            enemy.reset();
        }
        this.enemies = [];

        // 清理Boss
        for (const boss of this.bosses) {
            boss.reset();
        }
        this.bosses = [];

        // 清理子弹
        for (const bullet of this.bullets) {
            bullet.reset();
        }
        this.bullets = [];

        // 清理粒子
        this.particles.releaseAll();

        // 重置计时器
        this.gameTime = 0;
    }

    // 获取活跃敌人数量
    getActiveEnemyCount() {
        let count = 0;
        for (const enemy of this.enemies) {
            if (enemy.active) count++;
        }
        for (const boss of this.bosses) {
            if (boss.active) count++;
        }
        return count;
    }

    // 获取游戏状态
    getState() {
        return this.state;
    }
}
