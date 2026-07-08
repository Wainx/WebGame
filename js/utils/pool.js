// 对象池 - 用于复用游戏对象，减少GC
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 20) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];

        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    // 获取对象
    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }

    // 释放对象
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    // 释放所有活跃对象
    releaseAll() {
        while (this.active.length > 0) {
            const obj = this.active.pop();
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    // 获取活跃对象数量
    getActiveCount() {
        return this.active.length;
    }

    // 遍历所有活跃对象
    forEach(callback) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            callback(this.active[i], i);
        }
    }
}

// 子弹对象池
class BulletPool extends ObjectPool {
    constructor(container) {
        super(
            () => {
                const bullet = new PIXI.Graphics();
                bullet.beginFill(CONFIG.COLORS.BULLET);
                bullet.drawCircle(0, 0, 4);
                bullet.endFill();
                bullet.visible = false;
                container.addChild(bullet);
                return {
                    sprite: bullet,
                    x: 0, y: 0,
                    vx: 0, vy: 0,
                    damage: 0,
                    speed: 0,
                    size: 4,
                    piercing: false,
                    explosionRadius: 0,
                    active: false,
                    lifetime: 0,
                    maxLifetime: 2000
                };
            },
            (bullet) => {
                bullet.active = false;
                bullet.sprite.visible = false;
                bullet.lifetime = 0;
            },
            50
        );
    }

    // 发射子弹
    fire(x, y, angle, config, damageMultiplier = 1) {
        const bullet = this.get();
        bullet.x = x;
        bullet.y = y;
        bullet.vx = Math.cos(angle) * config.bulletSpeed;
        bullet.vy = Math.sin(angle) * config.bulletSpeed;
        bullet.damage = config.damage * damageMultiplier;
        bullet.speed = config.bulletSpeed;
        bullet.size = config.bulletSize;
        bullet.piercing = config.piercing || false;
        bullet.explosionRadius = config.explosionRadius || 0;
        bullet.active = true;
        bullet.sprite.visible = true;
        bullet.sprite.x = x;
        bullet.sprite.y = y;
        bullet.sprite.scale.set(config.bulletSize / 4);
        return bullet;
    }

    // 更新所有子弹
    update(delta) {
        this.forEach((bullet, index) => {
            if (!bullet.active) return;

            bullet.x += bullet.vx * delta;
            bullet.y += bullet.vy * delta;
            bullet.sprite.x = bullet.x;
            bullet.sprite.y = bullet.y;
            bullet.lifetime += delta * 16.67; // 假设60fps

            // 检查生命周期
            if (bullet.lifetime > bullet.maxLifetime) {
                this.release(bullet);
                return;
            }

            // 检查边界
            if (bullet.x < -50 || bullet.x > CONFIG.WORLD_WIDTH + 50 ||
                bullet.y < -50 || bullet.y > CONFIG.WORLD_HEIGHT + 50) {
                this.release(bullet);
            }
        });
    }
}

// 粒子对象池
class ParticlePool extends ObjectPool {
    constructor(container) {
        super(
            () => {
                const particle = new PIXI.Graphics();
                particle.beginFill(0xFFFFFF);
                particle.drawRect(-2, -2, 4, 4);
                particle.endFill();
                particle.visible = false;
                container.addChild(particle);
                return {
                    sprite: particle,
                    x: 0, y: 0,
                    vx: 0, vy: 0,
                    life: 0,
                    maxLife: 500,
                    color: 0xFFFFFF,
                    size: 4,
                    active: false
                };
            },
            (particle) => {
                particle.active = false;
                particle.sprite.visible = false;
                particle.life = 0;
            },
            100
        );
    }

    // 生成粒子
    emit(x, y, count, color, speed = 3, life = 500) {
        for (let i = 0; i < count; i++) {
            const particle = this.get();
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * speed + 1;

            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * spd;
            particle.vy = Math.sin(angle) * spd;
            particle.color = color;
            particle.life = 0;
            particle.maxLife = life + Math.random() * 200;
            particle.active = true;
            particle.sprite.visible = true;
            particle.sprite.tint = color;
            particle.sprite.x = x;
            particle.sprite.y = y;
            particle.sprite.alpha = 1;
            particle.size = Math.random() * 3 + 2;
            particle.sprite.scale.set(particle.size / 4);
        }
    }

    // 更新所有粒子
    update(delta) {
        this.forEach((particle) => {
            if (!particle.active) return;

            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            particle.sprite.x = particle.x;
            particle.sprite.y = particle.y;
            particle.life += delta * 16.67;
            particle.sprite.alpha = 1 - (particle.life / particle.maxLife);

            if (particle.life >= particle.maxLife) {
                this.release(particle);
            }
        });
    }
}
