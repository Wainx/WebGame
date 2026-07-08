// 波次管理系统
class WaveSystem {
    constructor(game) {
        this.game = game;

        // 波次状态
        this.currentWave = 0;
        this.waveTimer = 0;
        this.waveDuration = CONFIG.WAVES.WAVE_DURATION; // 30秒
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.WAVES.SPAWN_INTERVAL;
        this.waveActive = false;
        this.bossWave = false;
        this.bossSpawned = false;

        // 刷怪速率（随关卡递增）
        this.spawnRate = 1; // 每秒生成敌人数

        // 敌人生成位置
        this.spawnDistance = 400;
    }

    // 开始新波次
    startWave(waveNumber) {
        this.currentWave = waveNumber;
        this.waveTimer = 0;
        this.waveActive = true;
        this.spawnTimer = 0;
        this.bossSpawned = false;

        // 检查是否是Boss波
        this.bossWave = (waveNumber % CONFIG.WAVES.BOSS_INTERVAL === 0);

        // 计算刷怪速率：随关卡递增
        // 第1波：每2秒1个，第5波：每1.5秒1个，第10波：每1秒1个，第20波：每0.5秒1个
        this.spawnInterval = Math.max(500, CONFIG.WAVES.SPAWN_INTERVAL - (waveNumber - 1) * 80);
    }

    // 更新波次系统
    update(delta, playerX, playerY) {
        if (!this.waveActive) return;

        this.waveTimer += delta * 16.67;
        this.spawnTimer += delta * 16.67;

        // 持续生成敌人
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy(playerX, playerY);
        }

        // Boss波在开始时生成Boss
        if (this.bossWave && !this.bossSpawned) {
            this.spawnBoss(playerX, playerY);
            this.bossSpawned = true;
        }

        // 检查波次时间是否结束
        if (this.waveTimer >= this.waveDuration) {
            this.endWave();
        }
    }

    // 生成敌人
    spawnEnemy(playerX, playerY) {
        // 随机选择敌人类型（根据波次解锁更难的敌人）
        const enemyTypes = this.getAvailableEnemyTypes();
        const type = MathUtils.randomChoice(enemyTypes);

        // 计算生成位置（在玩家周围随机位置）
        const spawnPos = this.getSpawnPosition(playerX, playerY);

        // 创建敌人，波次越高敌人越强
        const waveMultiplier = 1 + (this.currentWave - 1) * 0.1;
        this.game.createEnemy(type, spawnPos.x, spawnPos.y, waveMultiplier);
    }

    // 生成Boss
    spawnBoss(playerX, playerY) {
        const bossTypes = ['GIANT', 'KING'];
        const type = this.currentWave >= 10 ? MathUtils.randomChoice(bossTypes) : 'GIANT';

        const angle = Math.random() * Math.PI * 2;
        const distance = 500;
        const x = playerX + Math.cos(angle) * distance;
        const y = playerY + Math.sin(angle) * distance;

        const waveMultiplier = 1 + (this.currentWave - 1) * 0.15;
        this.game.createBoss(type, x, y, waveMultiplier);
    }

    // 获取可用的敌人类型
    getAvailableEnemyTypes() {
        const types = ['NORMAL'];

        // 根据波次解锁敌人
        if (this.currentWave >= 2) types.push('FAST');
        if (this.currentWave >= 3) types.push('RANGED');
        if (this.currentWave >= 5) types.push('TANK');
        if (this.currentWave >= 7) types.push('EXPLODER');

        return types;
    }

    // 获取生成位置
    getSpawnPosition(playerX, playerY) {
        const angle = Math.random() * Math.PI * 2;
        const distance = this.spawnDistance + Math.random() * 200;

        let x = playerX + Math.cos(angle) * distance;
        let y = playerY + Math.sin(angle) * distance;

        // 限制在世界边界内
        x = MathUtils.clamp(x, 50, CONFIG.WORLD_WIDTH - 50);
        y = MathUtils.clamp(y, 50, CONFIG.WORLD_HEIGHT - 50);

        return { x, y };
    }

    // 结束波次 - 清场所有敌人
    endWave() {
        this.waveActive = false;

        // 清除所有活跃的敌人和Boss
        this.clearAllEnemies();

        // 通知游戏波次完成
        this.game.onWaveComplete(this.currentWave);
    }

    // 清除所有敌人
    clearAllEnemies() {
        // 清除普通敌人
        for (const enemy of this.game.enemies) {
            if (enemy.active) {
                // 死亡粒子效果
                this.game.particles.emit(enemy.x, enemy.y, 5, 0xFFFFFF, 3, 300);
                enemy.reset();
            }
        }

        // 清除Boss
        for (const boss of this.game.bosses) {
            if (boss.active) {
                this.game.particles.emit(boss.x, boss.y, 10, 0xFFD700, 5, 500);
                boss.reset();
            }
        }

        // 清除所有子弹
        for (const bullet of this.game.bullets) {
            if (bullet.active) {
                bullet.reset();
            }
        }
    }

    // 敌人死亡时调用（用于统计）
    onEnemyDeath() {
        // 不再需要追踪剩余敌人数量
    }

    // 获取波次信息
    getWaveInfo() {
        const timeLeft = Math.max(0, Math.ceil((this.waveDuration - this.waveTimer) / 1000));
        return {
            wave: this.currentWave,
            timer: Math.floor(this.waveTimer / 1000),
            duration: Math.floor(this.waveDuration / 1000),
            timeLeft: timeLeft,
            isBossWave: this.bossWave,
            spawnInterval: this.spawnInterval
        };
    }

    // 检查波次是否活跃
    isWaveActive() {
        return this.waveActive;
    }

    // 重置波次系统
    reset() {
        this.currentWave = 0;
        this.waveTimer = 0;
        this.waveActive = false;
        this.bossSpawned = false;
        this.spawnTimer = 0;
    }
}
