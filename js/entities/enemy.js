// 敌人实体
class Enemy {
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
        this.type = 'NORMAL';

        // 状态
        this.active = false;
        this.knockbackResistance = 0;

        // 攻击
        this.attackCooldown = 0;
        this.attackTimer = 0;

        // 特殊属性（远程敌人）
        this.attackRange = 0;
        this.projectileSpeed = 0;

        // 自爆属性
        this.explosionRadius = 0;
        this.exploding = false;
        this.explosionTimer = 0;

        // AI状态
        this.aiState = 'chase';
        this.stateTimer = 0;

        // 动画
        this.animTimer = 0;
        this.hitFlash = 0;
    }

    createSprite() {
        this.sprite = new PIXI.Graphics();
        this.sprite.visible = false;
        this.container.addChild(this.sprite);
    }

    // 初始化敌人
    init(type, x, y, waveMultiplier = 1) {
        const config = CONFIG.ENEMIES[type];
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
        this.sprite.visible = true;
        this.sprite.alpha = 1;
        this.hitFlash = 0;

        // 特殊属性
        this.attackRange = config.attackRange || 0;
        this.projectileSpeed = config.projectileSpeed || 0;
        this.explosionRadius = config.explosionRadius || 0;
        this.exploding = false;
        this.explosionTimer = 0;

        // 根据类型设置属性
        switch (type) {
            case 'NORMAL':
                this.knockbackResistance = 0.3;
                break;
            case 'FAST':
                this.knockbackResistance = 0.1;
                break;
            case 'TANK':
                this.knockbackResistance = 0.8;
                break;
            case 'RANGED':
                this.knockbackResistance = 0.2;
                break;
            case 'EXPLODER':
                this.knockbackResistance = 0.4;
                break;
        }

        this.drawSprite(config.color);
    }

    drawSprite(color) {
        this.sprite.clear();

        // 身体
        this.sprite.beginFill(color);
        this.sprite.drawEllipse(0, 0, this.size, this.size * 1.1);
        this.sprite.endFill();

        // 眼睛（愤怒表情）
        this.sprite.beginFill(0x000000);
        this.sprite.drawEllipse(-this.size * 0.3, -this.size * 0.2, this.size * 0.2, this.size * 0.25);
        this.sprite.drawEllipse(this.size * 0.3, -this.size * 0.2, this.size * 0.2, this.size * 0.25);
        this.sprite.endFill();

        // 红色瞳孔
        this.sprite.beginFill(0xFF0000);
        this.sprite.drawCircle(-this.size * 0.25, -this.size * 0.25, this.size * 0.1);
        this.sprite.drawCircle(this.size * 0.35, -this.size * 0.25, this.size * 0.1);
        this.sprite.endFill();

        // 嘴巴（不同类型不同表情）
        this.sprite.lineStyle(2, 0x000000);
        if (this.type === 'EXPLODER') {
            // 自爆敌人：O型嘴
            this.sprite.drawCircle(0, this.size * 0.3, this.size * 0.2);
        } else if (this.type === 'TANK') {
            // 坦克：锯齿嘴
            const mouthWidth = this.size * 0.4;
            this.sprite.moveTo(-mouthWidth, this.size * 0.3);
            for (let i = 0; i < 4; i++) {
                const xPos = -mouthWidth + (i + 0.5) * (mouthWidth * 2 / 4);
                const yPos = this.size * 0.3 + (i % 2 === 0 ? 4 : -4);
                this.sprite.lineTo(xPos, yPos);
            }
        } else {
            // 普通：弯曲嘴
            this.sprite.arc(0, this.size * 0.2, this.size * 0.3, 0.3, Math.PI - 0.3);
        }
        this.sprite.lineStyle(0);

        // 远程敌人标记
        if (this.type === 'RANGED') {
            this.sprite.beginFill(0xDDA0DD, 0.3);
            this.sprite.drawCircle(0, 0, this.attackRange * 0.3);
            this.sprite.endFill();
        }

        // 自爆敌人警告
        if (this.type === 'EXPLODER') {
            this.sprite.beginFill(0xFF6347, 0.3);
            this.sprite.drawCircle(0, 0, this.explosionRadius * 0.5);
            this.sprite.endFill();
        }
    }

    // 更新敌人状态
    update(delta, playerX, playerY, enemies) {
        if (!this.active) return;

        // 更新受击闪烁
        if (this.hitFlash > 0) {
            this.hitFlash -= delta * 16.67;
            this.sprite.tint = 0xFF0000;
        } else {
            this.sprite.tint = 0xFFFFFF;
        }

        // AI行为
        this.updateAI(delta, playerX, playerY, enemies);

        // 移动
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // 限制在世界边界
        this.x = MathUtils.clamp(this.x, this.size, CONFIG.WORLD_WIDTH - this.size);
        this.y = MathUtils.clamp(this.y, this.size, CONFIG.WORLD_HEIGHT - this.size);

        // 更新精灵位置
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        // 移动动画
        this.animTimer += delta * 0.15;
        this.sprite.y += Math.sin(this.animTimer) * 1.5;

        // 自爆倒计时
        if (this.exploding) {
            this.explosionTimer -= delta * 16.67;
            this.sprite.alpha = 0.5 + Math.sin(this.explosionTimer * 0.02) * 0.5;
            if (this.explosionTimer <= 0) {
                return 'explode';
            }
        }

        // 攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta * 16.67;
        }

        return null;
    }

    // AI行为更新
    updateAI(delta, playerX, playerY, enemies) {
        const distToPlayer = MathUtils.distance(this.x, this.y, playerX, playerY);
        const angleToPlayer = MathUtils.angle(this.x, this.y, playerX, playerY);

        switch (this.type) {
            case 'NORMAL':
            case 'TANK':
                // 直接追踪玩家
                this.vx = Math.cos(angleToPlayer) * this.speed;
                this.vy = Math.sin(angleToPlayer) * this.speed;
                break;

            case 'FAST':
                // 高速追踪，轻微随机偏移
                const wobble = Math.sin(this.animTimer * 3) * 0.3;
                this.vx = Math.cos(angleToPlayer + wobble) * this.speed;
                this.vy = Math.sin(angleToPlayer + wobble) * this.speed;
                break;

            case 'RANGED':
                // 保持距离攻击
                if (distToPlayer < this.attackRange * 0.7) {
                    // 后退
                    this.vx = -Math.cos(angleToPlayer) * this.speed;
                    this.vy = -Math.sin(angleToPlayer) * this.speed;
                } else if (distToPlayer > this.attackRange * 1.2) {
                    // 接近
                    this.vx = Math.cos(angleToPlayer) * this.speed;
                    this.vy = Math.sin(angleToPlayer) * this.speed;
                } else {
                    // 横向移动
                    const perpAngle = angleToPlayer + Math.PI / 2;
                    this.vx = Math.cos(perpAngle) * this.speed * 0.5;
                    this.vy = Math.sin(perpAngle) * this.speed * 0.5;
                }
                break;

            case 'EXPLODER':
                // 冲向玩家自爆
                if (distToPlayer < this.explosionRadius && !this.exploding) {
                    this.exploding = true;
                    this.explosionTimer = 500;
                }
                this.vx = Math.cos(angleToPlayer) * this.speed * (this.exploding ? 0.5 : 1);
                this.vy = Math.sin(angleToPlayer) * this.speed * (this.exploding ? 0.5 : 1);
                break;
        }

        // 简单的分离力（避免重叠）
        this.separateFromOther(enemies);
    }

    // 与其他敌人分离
    separateFromOther(enemies) {
        const separationForce = 0.5;
        let moveX = 0;
        let moveY = 0;
        let count = 0;

        for (const other of enemies) {
            if (other === this || !other.active) continue;

            const dist = MathUtils.distance(this.x, this.y, other.x, other.y);
            const minDist = this.size + other.size;

            if (dist < minDist && dist > 0) {
                const angle = MathUtils.angle(other.x, other.y, this.x, this.y);
                moveX += Math.cos(angle) * (minDist - dist) / minDist;
                moveY += Math.sin(angle) * (minDist - dist) / minDist;
                count++;
            }
        }

        if (count > 0) {
            this.vx += (moveX / count) * separationForce;
            this.vy += (moveY / count) * separationForce;
        }
    }

    // 受伤
    takeDamage(damage, knockbackX = 0, knockbackY = 0) {
        if (!this.active) return false;

        this.health -= damage;
        this.hitFlash = 100;

        // 击退效果
        const knockbackMult = 1 - this.knockbackResistance;
        this.x += knockbackX * knockbackMult;
        this.y += knockbackY * knockbackMult;

        // 检查死亡
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    // 死亡
    die() {
        this.active = false;
        this.sprite.visible = false;
    }

    // 重置敌人
    reset() {
        this.active = false;
        this.sprite.visible = false;
        this.exploding = false;
        this.explosionTimer = 0;
    }

    // 获取是否可以攻击
    canAttack() {
        return this.attackCooldown <= 0;
    }

    // 重置攻击冷却
    resetAttackCooldown() {
        this.attackCooldown = 1000; // 1秒冷却
    }
}
