// Boss实体
class Boss {
    constructor(container) {
        this.container = container;
        this.createSprite();

        // 位置和移动
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;

        // 属性
        this.maxHealth = 0;
        this.health = 0;
        this.speed = 0;
        this.damage = 0;
        this.size = 0;
        this.xpValue = 0;
        this.type = 'GIANT';

        // 状态
        this.active = false;
        this.currentPhase = 0;
        this.hitFlash = 0;

        // Boss特定属性
        this.phases = [];
        this.summonTimer = 0;
        this.summonInterval = 0;
        this.summonCount = 0;

        // 攻击模式
        this.attackPattern = 'normal';
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.chargeTarget = null;
        this.charging = false;
        this.chargeSpeed = 0;

        // 动画
        this.animTimer = 0;
        this.scaleMultiplier = 1;
    }

    createSprite() {
        this.sprite = new PIXI.Graphics();
        this.sprite.visible = false;
        this.container.addChild(this.sprite);

        // 血条背景
        this.healthBarBg = new PIXI.Graphics();
        this.healthBarBg.beginFill(0x333333);
        this.healthBarBg.drawRect(-40, -this.size - 20, 80, 8);
        this.healthBarBg.endFill();
        this.sprite.addChild(this.healthBarBg);

        // 血条
        this.healthBar = new PIXI.Graphics();
        this.sprite.addChild(this.healthBar);

        // Boss名字
        this.nameText = new PIXI.Text('', {
            fontFamily: 'Courier New',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.nameText.anchor.set(0.5, 1);
        this.nameText.y = -this.size - 25;
        this.sprite.addChild(this.nameText);
    }

    // 初始化Boss
    init(type, x, y, waveMultiplier = 1) {
        const config = CONFIG.BOSSES[type];
        if (!config) return;

        this.type = type;
        this.x = x;
        this.y = y;
        this.maxHealth = config.health * waveMultiplier;
        this.health = this.maxHealth;
        this.speed = config.speed;
        this.damage = config.damage * waveMultiplier;
        this.size = config.size;
        this.xpValue = config.xp;
        this.active = true;
        this.currentPhase = 0;
        this.sprite.visible = true;
        this.sprite.alpha = 1;
        this.hitFlash = 0;
        this.charging = false;

        // Boss特定配置
        this.phases = config.phases || [];
        this.summonInterval = config.summonInterval || 0;
        this.summonCount = config.summonCount || 0;
        this.summonTimer = this.summonInterval;

        // 设置名字
        this.nameText.text = config.name;

        this.drawSprite(config.color);
        this.updateHealthBar();
    }

    drawSprite(color) {
        this.sprite.clear();

        // 身体（更大的土豆）
        this.sprite.beginFill(color);
        this.sprite.drawEllipse(0, 0, this.size, this.size * 1.2);
        this.sprite.endFill();

        // 阴影
        this.sprite.beginFill(0x000000, 0.2);
        this.sprite.drawEllipse(0, this.size * 0.3, this.size * 0.8, this.size * 0.3);
        this.sprite.endFill();

        // 王冠（土豆国王）
        if (this.type === 'KING') {
            this.sprite.beginFill(0xFFD700);
            this.sprite.moveTo(-this.size * 0.6, -this.size * 0.8);
            this.sprite.lineTo(-this.size * 0.3, -this.size * 1.2);
            this.sprite.lineTo(0, -this.size * 0.9);
            this.sprite.lineTo(this.size * 0.3, -this.size * 1.2);
            this.sprite.lineTo(this.size * 0.6, -this.size * 0.8);
            this.sprite.closePath();
            this.sprite.endFill();

            // 宝石
            this.sprite.beginFill(0xFF0000);
            this.sprite.drawCircle(0, -this.size * 1.0, 5);
            this.sprite.endFill();
        }

        // 眼睛（愤怒）
        this.sprite.beginFill(0x000000);
        this.sprite.drawEllipse(-this.size * 0.3, -this.size * 0.2, this.size * 0.15, this.size * 0.2);
        this.sprite.drawEllipse(this.size * 0.3, -this.size * 0.2, this.size * 0.15, this.size * 0.2);
        this.sprite.endFill();

        // 红色瞳孔
        this.sprite.beginFill(0xFF0000);
        this.sprite.drawCircle(-this.size * 0.25, -this.size * 0.25, this.size * 0.08);
        this.sprite.drawCircle(this.size * 0.35, -this.size * 0.25, this.size * 0.08);
        this.sprite.endFill();

        // 嘴巴
        this.sprite.lineStyle(3, 0x000000);
        this.sprite.arc(0, this.size * 0.2, this.size * 0.3, 0.3, Math.PI - 0.3);
        this.sprite.lineStyle(0);

        // 体型指示器
        this.sprite.beginFill(color, 0.3);
        this.sprite.drawCircle(0, 0, this.size * 1.5);
        this.sprite.endFill();
    }

    // 更新Boss状态
    update(delta, playerX, playerY, enemyManager) {
        if (!this.active) return;

        // 更新受击闪烁
        if (this.hitFlash > 0) {
            this.hitFlash -= delta * 16.67;
            this.sprite.tint = 0xFF0000;
        } else {
            this.sprite.tint = 0xFFFFFF;
        }

        // 检查阶段转换
        this.checkPhaseTransition();

        // 更新攻击模式
        this.updateAttackPattern(delta, playerX, playerY);

        // AI行为
        this.updateAI(delta, playerX, playerY);

        // 移动
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // 限制在世界边界
        this.x = MathUtils.clamp(this.x, this.size, CONFIG.WORLD_WIDTH - this.size);
        this.y = MathUtils.clamp(this.y, this.size, CONFIG.WORLD_HEIGHT - this.size);

        // 更新精灵位置
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        // 动画
        this.animTimer += delta * 0.1;
        this.scaleMultiplier = 1 + Math.sin(this.animTimer * 2) * 0.05;
        this.sprite.scale.set(this.scaleMultiplier);

        // 召唤小怪（土豆国王）
        if (this.summonInterval > 0) {
            this.summonTimer -= delta * 16.67;
            if (this.summonTimer <= 0) {
                this.summonTimer = this.summonInterval;
                return 'summon';
            }
        }

        // 攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta * 16.67;
        }

        // 冲锋状态
        if (this.charging) {
            return this.updateCharge(delta);
        }

        return null;
    }

    // 检查阶段转换
    checkPhaseTransition() {
        const healthPercent = (this.health / this.maxHealth) * 100;

        for (let i = this.phases.length - 1; i >= 0; i--) {
            if (healthPercent <= this.phases[i].healthPercent && this.currentPhase < i + 1) {
                this.currentPhase = i + 1;
                this.speed = this.phases[i].speed;
                this.attackPattern = this.phases[i].attackPattern;
                this.attackTimer = 0;
                break;
            }
        }
    }

    // 更新攻击模式
    updateAttackPattern(delta, playerX, playerY) {
        this.attackTimer += delta * 16.67;

        switch (this.attackPattern) {
            case 'charge':
                if (this.attackTimer > 3000 && !this.charging) {
                    this.startCharge(playerX, playerY);
                    this.attackTimer = 0;
                }
                break;

            case 'slam':
                if (this.attackTimer > 2500) {
                    this.attackTimer = 0;
                    return 'slam';
                }
                break;

            case 'rage':
                this.speed = this.speed * 1.001; // 逐渐加速
                break;
        }

        return null;
    }

    // 开始冲锋
    startCharge(targetX, targetY) {
        this.charging = true;
        this.chargeTarget = { x: targetX, y: targetY };
        this.chargeSpeed = this.speed * 4;

        const angle = MathUtils.angle(this.x, this.y, targetX, targetY);
        this.vx = Math.cos(angle) * this.chargeSpeed;
        this.vy = Math.sin(angle) * this.chargeSpeed;
    }

    // 更新冲锋状态
    updateCharge(delta) {
        const dist = MathUtils.distance(this.x, this.y, this.chargeTarget.x, this.chargeTarget.y);

        if (dist < 50 || this.x < this.size || this.x > CONFIG.WORLD_WIDTH - this.size ||
            this.y < this.size || this.y > CONFIG.WORLD_HEIGHT - this.size) {
            this.charging = false;
            this.vx = 0;
            this.vy = 0;
            return 'chargeImpact';
        }

        return null;
    }

    // AI行为
    updateAI(delta, playerX, playerY) {
        if (this.charging) return;

        const distToPlayer = MathUtils.distance(this.x, this.y, playerX, playerY);
        const angleToPlayer = MathUtils.angle(this.x, this.y, playerX, playerY);

        // 追踪玩家
        if (distToPlayer > this.size * 3) {
            this.vx = Math.cos(angleToPlayer) * this.speed;
            this.vy = Math.sin(angleToPlayer) * this.speed;
        } else {
            // 在攻击范围内，减速
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
    }

    // 受伤
    takeDamage(damage, knockbackX = 0, knockbackY = 0) {
        if (!this.active) return false;

        this.health -= damage;
        this.hitFlash = 100;

        // Boss有击退抗性
        this.x += knockbackX * 0.2;
        this.y += knockbackY * 0.2;

        this.updateHealthBar();

        // 检查死亡
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    // 更新血条
    updateHealthBar() {
        this.healthBar.clear();
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 80;
        const barHeight = 8;

        // 血条颜色根据血量变化
        let color = 0x00FF00;
        if (healthPercent < 0.3) color = 0xFF0000;
        else if (healthPercent < 0.6) color = 0xFFFF00;

        this.healthBar.beginFill(color);
        this.healthBar.drawRect(-barWidth / 2, -this.size - 20, barWidth * healthPercent, barHeight);
        this.healthBar.endFill();
    }

    // 死亡
    die() {
        this.active = false;
        this.sprite.visible = false;
    }

    // 重置Boss
    reset() {
        this.active = false;
        this.sprite.visible = false;
        this.charging = false;
        this.currentPhase = 0;
    }

    // 获取是否可以攻击
    canAttack() {
        return this.attackCooldown <= 0;
    }

    // 重置攻击冷却
    resetAttackCooldown() {
        this.attackCooldown = 1500;
    }
}
