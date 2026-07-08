// 玩家实体
class Player {
    constructor(container) {
        this.container = container;

        // 位置和移动
        this.x = CONFIG.WORLD_WIDTH / 2;
        this.y = CONFIG.WORLD_HEIGHT / 2;
        this.vx = 0;
        this.vy = 0;

        // 属性
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
        this.health = this.maxHealth;
        this.speed = CONFIG.PLAYER.SPEED;
        this.size = CONFIG.PLAYER.SIZE;
        this.armor = 0;
        this.dodge = 0;
        this.critChance = 0;
        this.lifeSteal = 0;
        this.pickupRange = 50;
        this.luck = 0;
        this.hpRegen = 0;

        // 伤害加成
        this.damageMultiplier = 1;
        this.fireRateMultiplier = 1;

        // 角色被动相关
        this.characterId = null;
        this.characterName = null;
        this.characterIcon = null;
        this.characterColor = CONFIG.COLORS.PLAYER;
        this.passive = null;
        this.rangeBonus = 0;
        this.critDamageBonus = 0;
        this.healBonus = 0;
        this.currentDamageBonus = 0;
        this.currentSpeedBonus = 0;
        this.regenTimer = 0;

        // 等级和经验
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = CONFIG.PLAYER.XP_PER_LEVEL[0];

        // 状态
        this.invincible = false;
        this.invincibleTimer = 0;
        this.alive = true;

        // 武器
        this.weapons = [];
        this.currentWeaponIndex = 0;

        // 道具
        this.items = [];

        // 统计
        this.stats = {
            kills: 0,
            bossKills: 0,
            damageDealt: 0,
            damageTaken: 0,
            gold: 0,
            wave: 0,
            perfectWave: false,
            weaponsUsed: new Set(),
            timePlayed: 0
        };

        // 动画状态
        this.facingRight = true;
        this.animTime = 0;
        this.walkCycle = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.hitFlash = 0;
        this.deathAnim = 0;
        this.attackAnim = 0;

        // 创建精灵
        this.createSprite();
    }

    createSprite() {
        this.sprite = new PIXI.Container();
        this.sprite.pivot.set(0, 0);
        this.container.addChild(this.sprite);

        // 阴影
        this.shadow = new PIXI.Graphics();
        this.shadow.beginFill(0x000000, 0.25);
        this.shadow.drawEllipse(0, 0, this.size * 1.1, this.size * 0.35);
        this.shadow.endFill();
        this.shadow.y = this.size * 1.1;
        this.sprite.addChild(this.shadow);

        // 身体容器（用于动画）
        this.bodyContainer = new PIXI.Container();
        this.sprite.addChild(this.bodyContainer);

        // 身体图形
        this.bodyGfx = new PIXI.Graphics();
        this.bodyContainer.addChild(this.bodyGfx);

        // 装饰层
        this.decoGfx = new PIXI.Graphics();
        this.bodyContainer.addChild(this.decoGfx);

        // 武器
        this.weaponGfx = new PIXI.Graphics();
        this.sprite.addChild(this.weaponGfx);
    }

    // 更新角色外观
    updateCharacterSprite() {
        this.drawCharacter();
    }

    // 绘制角色（主方法）
    drawCharacter() {
        this.bodyGfx.clear();
        this.decoGfx.clear();

        const color = this.characterColor || 0xFFD700;
        const s = this.size;

        // 根据角色绘制
        switch (this.characterId) {
            case 'WARRIOR': this.drawWarriorBody(color, s); break;
            case 'RANGER': this.drawRangerBody(color, s); break;
            case 'MAGE': this.drawMageBody(color, s); break;
            case 'THIEF': this.drawThiefBody(color, s); break;
            case 'ENGINEER': this.drawEngineerBody(color, s); break;
            case 'DOCTOR': this.drawDoctorBody(color, s); break;
            case 'BERSERKER': this.drawBerserkerBody(color, s); break;
            default: this.drawDefaultBody(color, s); break;
        }

        this.drawWeapon();
    }

    // 通用土豆身体
    drawPotatoBase(gfx, color, s, darkerColor) {
        // 身体阴影
        gfx.beginFill(darkerColor || 0x000000, 0.2);
        gfx.drawEllipse(2, 3, s, s * 1.1);
        gfx.endFill();

        // 主身体
        gfx.beginFill(color);
        gfx.drawEllipse(0, 0, s, s * 1.1);
        gfx.endFill();

        // 高光
        gfx.beginFill(0xFFFFFF, 0.25);
        gfx.drawEllipse(-s * 0.3, -s * 0.4, s * 0.35, s * 0.2);
        gfx.endFill();
    }

    // 通用脸部
    drawFace(gfx, s, eyeStyle, mouthStyle) {
        // 眼白
        gfx.beginFill(0xFFFFFF);
        gfx.drawEllipse(-s * 0.28, -s * 0.15, s * 0.2, s * 0.25);
        gfx.drawEllipse(s * 0.28, -s * 0.15, s * 0.2, s * 0.25);
        gfx.endFill();

        // 瞳孔
        const pupilColor = eyeStyle === 'red' ? 0xCC0000 : 0x000000;
        gfx.beginFill(pupilColor);
        gfx.drawEllipse(-s * 0.25, -s * 0.1, s * 0.12, s * 0.16);
        gfx.drawEllipse(s * 0.25, -s * 0.1, s * 0.12, s * 0.16);
        gfx.endFill();

        // 眼睛高光
        gfx.beginFill(0xFFFFFF);
        gfx.drawCircle(-s * 0.2, -s * 0.18, s * 0.06);
        gfx.drawCircle(s * 0.3, -s * 0.18, s * 0.06);
        gfx.endFill();

        // 腮红
        gfx.beginFill(0xFF9999, 0.3);
        gfx.drawEllipse(-s * 0.5, s * 0.15, s * 0.15, s * 0.1);
        gfx.drawEllipse(s * 0.5, s * 0.15, s * 0.15, s * 0.1);
        gfx.endFill();

        // 嘴巴
        gfx.lineStyle(2, 0x000000);
        if (mouthStyle === 'smile') {
            gfx.arc(0, s * 0.2, s * 0.18, 0.2, Math.PI - 0.2);
        } else if (mouthStyle === 'grin') {
            gfx.arc(0, s * 0.15, s * 0.22, 0.1, Math.PI - 0.1);
        } else if (mouthStyle === 'open') {
            gfx.lineStyle(0);
            gfx.beginFill(0x000000);
            gfx.drawEllipse(0, s * 0.22, s * 0.1, s * 0.12);
            gfx.endFill();
        } else {
            gfx.arc(0, s * 0.2, s * 0.12, 0.3, Math.PI - 0.3);
        }
        gfx.lineStyle(0);
    }

    // 默认角色
    drawDefaultBody(color, s) {
        this.drawPotatoBase(this.bodyGfx, color, s);
        this.drawFace(this.bodyGfx, s, 'normal', 'smile');
    }

    // 战士
    drawWarriorBody(color, s) {
        // 头盔
        this.decoGfx.beginFill(0x666666);
        this.decoGfx.drawEllipse(0, -s * 0.6, s * 1.05, s * 0.4);
        this.decoGfx.endFill();
        this.decoGfx.beginFill(0x777777);
        this.decoGfx.drawEllipse(0, -s * 0.9, s * 0.6, s * 0.25);
        this.decoGfx.endFill();
        // 护鼻
        this.decoGfx.beginFill(0x555555);
        this.decoGfx.drawRect(-s * 0.08, -s * 0.4, s * 0.16, s * 0.35);
        this.decoGfx.endFill();

        this.drawPotatoBase(this.bodyGfx, color, s, 0x880000);

        // 护甲
        this.decoGfx.beginFill(0x888888, 0.35);
        this.decoGfx.drawEllipse(0, s * 0.2, s * 0.7, s * 0.45);
        this.decoGfx.endFill();

        this.drawFace(this.bodyGfx, s, 'normal', 'grin');
    }

    // 游侠
    drawRangerBody(color, s) {
        this.drawPotatoBase(this.bodyGfx, color, s, 0x005500);

        // 兜帽
        this.decoGfx.beginFill(0x1B5E20);
        this.decoGfx.moveTo(0, -s * 1.5);
        this.decoGfx.lineTo(-s * 0.9, -s * 0.3);
        this.decoGfx.lineTo(s * 0.9, -s * 0.3);
        this.decoGfx.closePath();
        this.decoGfx.endFill();
        this.decoGfx.beginFill(0x2E7D32);
        this.decoGfx.drawEllipse(0, -s * 0.4, s * 0.7, s * 0.2);
        this.decoGfx.endFill();

        this.drawFace(this.bodyGfx, s, 'normal', 'smile');
    }

    // 法师
    drawMageBody(color, s) {
        this.drawPotatoBase(this.bodyGfx, color, s, 0x440066);

        // 法师帽檐
        this.decoGfx.beginFill(0x4A148C);
        this.decoGfx.drawEllipse(0, -s * 0.55, s * 1.1, s * 0.25);
        this.decoGfx.endFill();
        // 帽身
        this.decoGfx.beginFill(0x6A1B9A);
        this.decoGfx.moveTo(0, -s * 2.0);
        this.decoGfx.lineTo(-s * 0.8, -s * 0.55);
        this.decoGfx.lineTo(s * 0.8, -s * 0.55);
        this.decoGfx.closePath();
        this.decoGfx.endFill();
        // 星星
        this.drawStar(this.decoGfx, 0, -s * 1.2, s * 0.18, 0xFFD700);

        this.drawFace(this.bodyGfx, s, 'normal', 'smile');

        // 魔法光环
        this.decoGfx.beginFill(0xAA44FF, 0.08);
        this.decoGfx.drawCircle(0, 0, s * 1.6);
        this.decoGfx.endFill();
    }

    // 盗贼
    drawThiefBody(color, s) {
        this.drawPotatoBase(this.bodyGfx, color, s, 0x888800);

        // 面罩
        this.decoGfx.beginFill(0x222222, 0.8);
        this.decoGfx.drawEllipse(0, 0, s * 0.9, s * 0.45);
        this.decoGfx.endFill();

        // 眼睛（露在外面）
        this.bodyGfx.beginFill(0xFFFFFF);
        this.bodyGfx.drawEllipse(-s * 0.28, -s * 0.25, s * 0.18, s * 0.2);
        this.bodyGfx.drawEllipse(s * 0.28, -s * 0.25, s * 0.18, s * 0.2);
        this.bodyGfx.endFill();
        this.bodyGfx.beginFill(0x000000);
        this.bodyGfx.drawEllipse(-s * 0.25, -s * 0.22, s * 0.1, s * 0.14);
        this.bodyGfx.drawEllipse(s * 0.25, -s * 0.22, s * 0.1, s * 0.14);
        this.bodyGfx.endFill();
        this.bodyGfx.beginFill(0xFFFFFF);
        this.bodyGfx.drawCircle(-s * 0.2, -s * 0.28, s * 0.04);
        this.bodyGfx.drawCircle(s * 0.3, -s * 0.28, s * 0.04);
        this.bodyGfx.endFill();
    }

    // 工程师
    drawEngineerBody(color, s) {
        this.drawPotatoBase(this.bodyGfx, color, s, 0x006666);
        this.drawFace(this.bodyGfx, s, 'normal', 'smile');

        // 护目镜
        this.decoGfx.lineStyle(3, 0x666666);
        this.decoGfx.drawEllipse(-s * 0.28, -s * 0.15, s * 0.25, s * 0.22);
        this.decoGfx.drawEllipse(s * 0.28, -s * 0.15, s * 0.25, s * 0.22);
        this.decoGfx.lineStyle(0);
        this.decoGfx.beginFill(0x666666);
        this.decoGfx.drawRect(-s * 0.05, -s * 0.2, s * 0.1, s * 0.08);
        this.decoGfx.endFill();
        this.decoGfx.beginFill(0x00BCD4, 0.35);
        this.decoGfx.drawEllipse(-s * 0.28, -s * 0.15, s * 0.2, s * 0.18);
        this.decoGfx.drawEllipse(s * 0.28, -s * 0.15, s * 0.2, s * 0.18);
        this.decoGfx.endFill();
    }

    // 医生
    drawDoctorBody(color, s) {
        // 医生帽
        this.decoGfx.beginFill(0xFFFFFF);
        this.decoGfx.drawEllipse(0, -s * 0.7, s * 0.7, s * 0.3);
        this.decoGfx.endFill();
        this.decoGfx.beginFill(0xEEEEEE);
        this.decoGfx.drawEllipse(0, -s * 0.5, s * 0.8, s * 0.12);
        this.decoGfx.endFill();
        // 红十字
        this.decoGfx.beginFill(0xFF0000);
        this.decoGfx.drawRect(-s * 0.06, -s * 0.95, s * 0.12, s * 0.3);
        this.decoGfx.drawRect(-s * 0.15, -s * 0.85, s * 0.3, s * 0.1);
        this.decoGfx.endFill();

        this.drawPotatoBase(this.bodyGfx, color, s, 0x993333);
        this.drawFace(this.bodyGfx, s, 'normal', 'smile');
    }

    // 狂战士
    drawBerserkerBody(color, s) {
        // 怒气光环
        this.decoGfx.beginFill(0xFF4400, 0.1);
        this.decoGfx.drawCircle(0, 0, s * 1.8);
        this.decoGfx.endFill();

        this.drawPotatoBase(this.bodyGfx, color, s, 0x884400);

        // 愤怒眼睛
        this.bodyGfx.beginFill(0xFFFFFF);
        this.bodyGfx.drawEllipse(-s * 0.28, -s * 0.15, s * 0.2, s * 0.25);
        this.bodyGfx.drawEllipse(s * 0.28, -s * 0.15, s * 0.2, s * 0.25);
        this.bodyGfx.endFill();
        this.bodyGfx.beginFill(0xCC0000);
        this.bodyGfx.drawEllipse(-s * 0.25, -s * 0.1, s * 0.14, s * 0.18);
        this.bodyGfx.drawEllipse(s * 0.25, -s * 0.1, s * 0.14, s * 0.18);
        this.bodyGfx.endFill();
        this.bodyGfx.beginFill(0x000000);
        this.bodyGfx.drawEllipse(-s * 0.25, -s * 0.1, s * 0.07, s * 0.1);
        this.bodyGfx.drawEllipse(s * 0.25, -s * 0.1, s * 0.07, s * 0.1);
        this.bodyGfx.endFill();

        // 怒眉
        this.bodyGfx.lineStyle(3, 0x000000);
        this.bodyGfx.moveTo(-s * 0.45, -s * 0.4);
        this.bodyGfx.lineTo(-s * 0.1, -s * 0.3);
        this.bodyGfx.moveTo(s * 0.45, -s * 0.4);
        this.bodyGfx.lineTo(s * 0.1, -s * 0.3);
        this.bodyGfx.lineStyle(0);

        // 怒吼嘴
        this.bodyGfx.beginFill(0x000000);
        this.bodyGfx.drawEllipse(0, s * 0.25, s * 0.2, s * 0.13);
        this.bodyGfx.endFill();
        this.bodyGfx.beginFill(0xCC2222);
        this.bodyGfx.drawEllipse(0, s * 0.23, s * 0.13, s * 0.07);
        this.bodyGfx.endFill();

        // 伤疤
        this.decoGfx.lineStyle(2, 0x880000);
        this.decoGfx.moveTo(-s * 0.55, -s * 0.05);
        this.decoGfx.lineTo(-s * 0.3, s * 0.3);
        this.decoGfx.lineStyle(0);
    }

    // 绘制五角星
    drawStar(gfx, cx, cy, r, color) {
        gfx.beginFill(color);
        const points = 5;
        const step = Math.PI / points;
        gfx.moveTo(cx, cy - r);
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? r : r * 0.4;
            const angle = -Math.PI / 2 + step * i;
            gfx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        }
        gfx.closePath();
        gfx.endFill();
    }

    // 绘制武器
    drawWeapon() {
        this.weaponGfx.clear();
        const weapon = this.getCurrentWeapon();
        if (!weapon) return;

        const colors = {
            'PISTOL': 0x888888, 'SHOTGUN': 0x8B4513, 'SMG': 0x444444,
            'LASER': 0x00FFFF, 'ROCKET': 0x555555, 'LIGHTNING': 0xFFFF00
        };
        const c = colors[weapon.id] || 0x888888;

        switch (weapon.id) {
            case 'SHOTGUN':
                this.weaponGfx.beginFill(c); this.weaponGfx.drawRect(10, -4, 28, 8); this.weaponGfx.endFill();
                this.weaponGfx.beginFill(0x333333); this.weaponGfx.drawRect(30, -3, 10, 6); this.weaponGfx.endFill();
                break;
            case 'SMG':
                this.weaponGfx.beginFill(c); this.weaponGfx.drawRect(12, -3, 22, 6); this.weaponGfx.drawRect(18, -8, 8, 5); this.weaponGfx.endFill();
                this.weaponGfx.beginFill(0x333333); this.weaponGfx.drawRect(20, 3, 6, 10); this.weaponGfx.endFill();
                break;
            case 'LASER':
                this.weaponGfx.beginFill(0x444444); this.weaponGfx.drawRect(12, -2, 20, 4); this.weaponGfx.endFill();
                this.weaponGfx.beginFill(c); this.weaponGfx.drawRect(30, -4, 8, 8); this.weaponGfx.endFill();
                this.weaponGfx.beginFill(c, 0.3); this.weaponGfx.drawCircle(34, 0, 10); this.weaponGfx.endFill();
                break;
            case 'ROCKET':
                this.weaponGfx.beginFill(c); this.weaponGfx.drawRect(8, -5, 30, 10); this.weaponGfx.endFill();
                this.weaponGfx.beginFill(0x222222); this.weaponGfx.drawRect(34, -7, 8, 14); this.weaponGfx.endFill();
                break;
            case 'LIGHTNING':
                this.weaponGfx.beginFill(0x444444); this.weaponGfx.drawRect(12, -3, 18, 6); this.weaponGfx.endFill();
                this.weaponGfx.beginFill(c); this.weaponGfx.drawCircle(32, -5, 4); this.weaponGfx.drawCircle(32, 5, 4); this.weaponGfx.endFill();
                this.weaponGfx.lineStyle(2, c, 0.6); this.weaponGfx.moveTo(32, -5); this.weaponGfx.lineTo(38, 0); this.weaponGfx.lineTo(32, 5); this.weaponGfx.lineStyle(0);
                break;
            default: // PISTOL
                this.weaponGfx.beginFill(c); this.weaponGfx.drawRect(15, -3, 18, 6); this.weaponGfx.drawRect(20, -8, 6, 5); this.weaponGfx.endFill();
        }
    }

    // 更新玩家状态
    update(delta, input, camera) {
        if (!this.alive) return;

        const dt = delta * 16.67;

        // 生命回复
        if (this.hpRegen > 0) {
            this.regenTimer += dt;
            if (this.regenTimer >= 1000) {
                this.regenTimer -= 1000;
                this.heal(this.hpRegen);
            }
        }

        // 移动
        const effectiveSpeed = this.speed * (1 + (this.currentSpeedBonus || 0));
        const movement = input.getMovement();
        this.vx = movement.x * effectiveSpeed;
        this.vy = movement.y * effectiveSpeed;
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.x = MathUtils.clamp(this.x, this.size, CONFIG.WORLD_WIDTH - this.size);
        this.y = MathUtils.clamp(this.y, this.size, CONFIG.WORLD_HEIGHT - this.size);

        this.sprite.x = this.x;
        this.sprite.y = this.y;

        // 朝向
        if (this.vx > 0.1) this.facingRight = true;
        else if (this.vx < -0.1) this.facingRight = false;
        const targetX = this.facingRight ? 1 : -1;
        this.bodyContainer.scale.x += (targetX - this.bodyContainer.scale.x) * 0.15;

        // 动画时间
        this.animTime += dt * 0.001;
        const isMoving = Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1;

        // 移动弹跳
        if (isMoving) {
            this.walkCycle += dt * 0.008;
            const bounce = Math.abs(Math.sin(this.walkCycle)) * 4;
            this.bodyContainer.y = -bounce;
            const squash = 1 + Math.sin(this.walkCycle * 2) * 0.06;
            this.bodyContainer.scale.y = 1 / squash;
            this.bodyContainer.scale.x = targetX * squash;
            this.shadow.scale.set(1 - bounce * 0.03);
        } else {
            this.walkCycle = 0;
            this.bodyContainer.y = 0;
            this.bodyContainer.scale.y += (1 - this.bodyContainer.scale.y) * 0.1;
            this.shadow.scale.x += (1 - this.shadow.scale.x) * 0.1;
            this.shadow.scale.y += (1 - this.shadow.scale.y) * 0.1;
        }

        // 呼吸
        const breathe = Math.sin(this.animTime * 3) * 0.015;
        if (!isMoving) {
            this.bodyContainer.scale.y = 1 + breathe;
        }

        // 眨眼
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.blinkTimer = 2000 + Math.random() * 3000;
            this.isBlinking = true;
            setTimeout(() => { this.isBlinking = false; }, 150);
        }

        // 受伤闪烁
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
            this.bodyGfx.tint = 0xFF4444;
        } else {
            this.bodyGfx.tint = 0xFFFFFF;
        }

        // 无敌闪烁
        if (this.invincible) {
            this.invincibleTimer -= dt;
            this.sprite.alpha = Math.sin(this.invincibleTimer * 0.02) * 0.5 + 0.5;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.sprite.alpha = 1;
            }
        }

        this.stats.timePlayed += dt;
    }

    // 受伤
    takeDamage(damage) {
        if (!this.alive || this.invincible) return false;
        if (Math.random() < this.dodge) return false;

        const finalDamage = Math.max(1, damage - this.armor);
        this.health -= finalDamage;
        this.stats.damageTaken += finalDamage;

        this.hitFlash = 150;
        this.bodyContainer.scale.set(1.3, 0.7);

        this.invincible = true;
        this.invincibleTimer = CONFIG.PLAYER.INVINCIBLE_TIME;

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        return true;
    }

    heal(amount) {
        const bonus = this.healBonus || 0;
        this.health = Math.min(this.maxHealth, this.health + amount * (1 + bonus));
    }

    gainXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        const idx = Math.min(this.level - 1, CONFIG.PLAYER.XP_PER_LEVEL.length - 1);
        this.xpToNextLevel = CONFIG.PLAYER.XP_PER_LEVEL[idx];
        this.heal(this.maxHealth * 0.2);
        return true;
    }

    gainGold(amount) { this.stats.gold += amount; }

    die() {
        this.alive = false;
        this.sprite.visible = false;
    }

    revive() {
        this.alive = true;
        this.health = this.maxHealth;
        this.sprite.visible = true;
        this.sprite.alpha = 1;
        this.sprite.scale.set(1);
        this.bodyContainer.scale.set(1);
        this.invincible = false;
        this.x = CONFIG.WORLD_WIDTH / 2;
        this.y = CONFIG.WORLD_HEIGHT / 2;
    }

    equipWeapon(weaponId) {
        const cfg = CONFIG.WEAPONS[weaponId];
        if (!cfg) return;
        const weapon = { id: weaponId, ...cfg, level: 1, cooldown: 0, lastFireTime: 0 };
        if (this.weapons.length < 4) this.weapons.push(weapon);
        else this.weapons[this.currentWeaponIndex] = weapon;
        this.stats.weaponsUsed.add(weaponId);
        this.currentWeaponIndex = this.weapons.length - 1;
        this.drawWeapon();
    }

    getCurrentWeapon() {
        return this.weapons.length === 0 ? null : this.weapons[this.currentWeaponIndex];
    }

    addItem(itemId) {
        const cfg = CONFIG.ITEMS[itemId];
        if (!cfg) return;
        this.items.push({ id: itemId, ...cfg });
        this.applyItemEffect(cfg.effect);
    }

    applyItemEffect(effect) {
        if (effect.maxHealth) { this.maxHealth += effect.maxHealth; this.health += effect.maxHealth; }
        if (effect.speed) this.speed += effect.speed;
        if (effect.damagePercent) this.damageMultiplier += effect.damagePercent;
        if (effect.fireRatePercent) this.fireRateMultiplier += effect.fireRatePercent;
        if (effect.armor) this.armor += effect.armor;
        if (effect.dodge) this.dodge = Math.min(0.5, this.dodge + effect.dodge);
        if (effect.critChance) this.critChance = Math.min(0.5, this.critChance + effect.critChance);
        if (effect.lifeSteal) this.lifeSteal += effect.lifeSteal;
        if (effect.pickupRange) this.pickupRange += effect.pickupRange;
        if (effect.luck) this.luck += effect.luck;
    }

    getStats() {
        return {
            ...this.stats, level: this.level, maxHealth: this.maxHealth, speed: this.speed,
            armor: this.armor, dodge: this.dodge, critChance: this.critChance,
            damageMultiplier: this.damageMultiplier, fireRateMultiplier: this.fireRateMultiplier,
            hpRegen: this.hpRegen, lifeSteal: this.lifeSteal, luck: this.luck,
            pickupRange: this.pickupRange, characterName: this.characterName
        };
    }

    reset() {
        this.revive();
        this.level = 1; this.xp = 0;
        this.xpToNextLevel = CONFIG.PLAYER.XP_PER_LEVEL[0];
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH; this.health = this.maxHealth;
        this.speed = CONFIG.PLAYER.SPEED; this.armor = 0; this.dodge = 0;
        this.critChance = 0; this.lifeSteal = 0; this.pickupRange = 50;
        this.luck = 0; this.hpRegen = 0;
        this.damageMultiplier = 1; this.fireRateMultiplier = 1;
        this.characterId = null; this.characterName = null; this.characterIcon = null;
        this.characterColor = CONFIG.COLORS.PLAYER; this.passive = null;
        this.rangeBonus = 0; this.critDamageBonus = 0; this.healBonus = 0;
        this.currentDamageBonus = 0; this.currentSpeedBonus = 0; this.regenTimer = 0;
        this.hitFlash = 0; this.animTime = 0; this.walkCycle = 0;
        this.weapons = []; this.items = [];
        this.stats = {
            kills: 0, bossKills: 0, damageDealt: 0, damageTaken: 0, gold: 0,
            wave: 0, perfectWave: false, weaponsUsed: new Set(), timePlayed: 0
        };
        this.bodyGfx.clear(); this.decoGfx.clear(); this.weaponGfx.clear();
        this.bodyGfx.tint = 0xFFFFFF;
    }
}
