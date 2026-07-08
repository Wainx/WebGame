// 投射物实体（子弹、敌人子弹）
class Projectile {
    constructor(container, isEnemy = false) {
        this.container = container;
        this.isEnemy = isEnemy;
        this.createSprite();

        // 位置和移动
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;

        // 属性
        this.damage = 0;
        this.speed = 0;
        this.size = 4;
        this.piercing = false;
        this.explosionRadius = 0;
        this.chainCount = 0;
        this.chainRange = 0;

        // 状态
        this.active = false;
        this.lifetime = 0;
        this.maxLifetime = 2000;
        this.hitTargets = new Set(); // 已击中的目标（穿透用）
    }

    createSprite() {
        this.sprite = new PIXI.Graphics();
        this.sprite.visible = false;
        this.container.addChild(this.sprite);
    }

    // 初始化投射物
    init(x, y, angle, config, damageMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * config.bulletSpeed;
        this.vy = Math.sin(angle) * config.bulletSpeed;
        this.damage = config.damage * damageMultiplier;
        this.speed = config.bulletSpeed;
        this.size = config.bulletSize || 4;
        this.piercing = config.piercing || false;
        this.explosionRadius = config.explosionRadius || 0;
        this.chainCount = config.chainCount || 0;
        this.chainRange = config.chainRange || 0;
        this.active = true;
        this.lifetime = 0;
        this.maxLifetime = 2000;
        this.hitTargets.clear();

        // 绘制精灵
        this.drawSprite();

        this.sprite.visible = true;
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.rotation = angle;
    }

    drawSprite() {
        this.sprite.clear();

        if (this.isEnemy) {
            // 敌人子弹：红色
            this.sprite.beginFill(CONFIG.COLORS.ENEMY_BULLET);
            this.sprite.drawCircle(0, 0, this.size);
            this.sprite.endFill();

            // 尾迹
            this.sprite.beginFill(CONFIG.COLORS.ENEMY_BULLET, 0.3);
            this.sprite.drawCircle(-this.size, 0, this.size * 0.6);
            this.sprite.endFill();
        } else {
            // 玩家子弹：黄色
            this.sprite.beginFill(CONFIG.COLORS.BULLET);
            this.sprite.drawCircle(0, 0, this.size);
            this.sprite.endFill();

            // 发光效果
            this.sprite.beginFill(0xFFFFFF, 0.5);
            this.sprite.drawCircle(0, 0, this.size * 0.5);
            this.sprite.endFill();

            // 火箭弹特殊外观
            if (this.explosionRadius > 0) {
                this.sprite.beginFill(0xFF4500);
                this.sprite.drawCircle(0, 0, this.size * 1.2);
                this.sprite.endFill();
            }
        }
    }

    // 更新投射物
    update(delta) {
        if (!this.active) return;

        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.lifetime += delta * 16.67;

        // 生命周期检查
        if (this.lifetime > this.maxLifetime) {
            this.deactivate();
            return;
        }

        // 边界检查
        if (this.x < -50 || this.x > CONFIG.WORLD_WIDTH + 50 ||
            this.y < -50 || this.y > CONFIG.WORLD_HEIGHT + 50) {
            this.deactivate();
        }
    }

    // 命中目标
    hit(target) {
        if (this.hitTargets.has(target)) {
            return false; // 已经命中过
        }

        this.hitTargets.add(target);

        // 穿透子弹不消失
        if (!this.piercing) {
            this.deactivate();
        }

        return true;
    }

    // 停用投射物
    deactivate() {
        this.active = false;
        this.sprite.visible = false;
        this.hitTargets.clear();
    }

    // 重置投射物
    reset() {
        this.deactivate();
    }

    // 获取位置
    getPosition() {
        return { x: this.x, y: this.y };
    }

    // 获取伤害
    getDamage() {
        return this.damage;
    }
}

// 闪电效果（电击器武器）
class LightningEffect {
    constructor(container) {
        this.container = container;
        this.sprite = new PIXI.Graphics();
        this.sprite.visible = false;
        container.addChild(this.sprite);

        this.points = [];
        this.lifetime = 0;
        this.maxLifetime = 200;
        this.active = false;
    }

    // 创建闪电效果
    create(startX, startY, endX, endY, branches = []) {
        this.sprite.clear();
        this.sprite.visible = true;
        this.active = true;
        this.lifetime = 0;

        // 主闪电
        this.drawLightning(startX, startY, endX, endY, 3, 0xFFFF00);

        // 分支闪电
        for (const branch of branches) {
            this.drawLightning(branch.x1, branch.y1, branch.x2, branch.y2, 2, 0x00FFFF);
        }
    }

    // 绘制闪电
    drawLightning(x1, y1, x2, y2, width, color) {
        const segments = 8;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        const offset = 20;

        this.sprite.lineStyle(width, color);
        this.sprite.moveTo(x1, y1);

        for (let i = 1; i < segments; i++) {
            const jitterX = (Math.random() - 0.5) * offset;
            const jitterY = (Math.random() - 0.5) * offset;
            this.sprite.lineTo(x1 + dx * i + jitterX, y1 + dy * i + jitterY);
        }

        this.sprite.lineTo(x2, y2);
        this.sprite.lineStyle(0);
    }

    // 更新效果
    update(delta) {
        if (!this.active) return;

        this.lifetime += delta * 16.67;
        this.sprite.alpha = 1 - (this.lifetime / this.maxLifetime);

        if (this.lifetime >= this.maxLifetime) {
            this.active = false;
            this.sprite.visible = false;
        }
    }

    // 重置
    reset() {
        this.active = false;
        this.sprite.visible = false;
    }
}
