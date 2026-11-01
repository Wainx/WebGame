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
      timePlayed: 0,
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
    this.container.addChild(this.sprite);
    this.rig = null;
    this.weaponGfx = new PIXI.Graphics();
    this.sprite.addChild(this.weaponGfx);
    this.muzzle = new PIXI.Graphics();
    this.muzzle.beginFill(0xffe9b3);
    this.muzzle.drawPolygon([37, 0, 46, -7, 43, -2, 54, 0, 43, 2, 46, 7]);
    this.muzzle.endFill();
    this.weaponGfx.addChild(this.muzzle);
    this.muzzle.visible = false;
    this.motion = 0;
    this.look = 1;
    this.aimAngle = 0;
    this.recoil = 0;
    this.blinkLeft = 0;
    this.drawCharacter();
  }

  updateCharacterSprite() {
    this.drawCharacter();
  }

  drawCharacter() {
    if (this.rig) {
      this.sprite.removeChild(this.rig.root);
      this.rig.root.destroy({ children: true });
    }
    this.rig = PotatoArt.create(this.characterId || "WELL_ROUNDED", this.size);
    this.sprite.addChildAt(this.rig.root, 0);
    this.bodyContainer = this.rig.torso;
    this.drawWeapon();
  }

  drawWeapon() {
    const g = this.weaponGfx;
    g.clear();
    const weapon = this.getCurrentWeapon();
    if (!weapon) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const colors = {
      PISTOL: 0x8fa5b5,
      SHOTGUN: 0xa87549,
      SMG: 0x657b88,
      LASER: 0x76d9d2,
      ROCKET: 0x889e68,
      LIGHTNING: 0xe2c873,
    };
    const color = colors[weapon.id] || colors.PISTOL;
    PotatoArt.ellipse(g, 13, 5, 6, 6, 0xe8b77a);
    PotatoArt.rect(g, 17, 3, 7, 10, 0x46515d, 2);
    PotatoArt.rect(g, 13, -5, 23, 10, color, 3);
    PotatoArt.rect(g, 31, -4, 9, 8, 0x303d48, 2);
    g.lineStyle(1.3, 0xdce7df, 0.7);
    g.moveTo(17, -2);
    g.lineTo(29, -2);
    g.lineStyle(0);
    if (weapon.id === "SHOTGUN") PotatoArt.rect(g, 20, 3, 11, 4, 0xd7a36d, 1);
    if (weapon.id === "SMG") PotatoArt.rect(g, 25, 5, 6, 9, 0x46515d, 1);
    if (weapon.id === "ROCKET") PotatoArt.rect(g, 11, -8, 28, 16, color, 4);
    if (["LASER", "LIGHTNING"].includes(weapon.id)) {
      PotatoArt.ellipse(g, 30, 0, 4, 4, color, false);
      g.lineStyle(2, 0xf1f3c5);
      g.moveTo(20, -2);
      g.lineTo(24, 2);
      g.lineTo(27, -2);
      g.lineStyle(0);
    }
  }

  aimAt(angle, delta) {
    const diff = Math.atan2(
      Math.sin(angle - this.aimAngle),
      Math.cos(angle - this.aimAngle),
    );
    this.aimAngle += diff * (1 - Math.exp((-18 * delta) / 60));
  }

  onShoot(angle, weapon) {
    this.aimAngle = angle;
    this.recoil = weapon.id === "SHOTGUN" || weapon.id === "ROCKET" ? 1 : 0.65;
    this.attackAnim = 65;
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
    this.y = MathUtils.clamp(
      this.y,
      this.size,
      CONFIG.WORLD_HEIGHT - this.size,
    );

    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Separate movement, facing, recoil and blink channels; all use game time.
    const seconds = delta / 60,
      blend = 1 - Math.exp(-14 * seconds);
    const moving = Math.hypot(this.vx, this.vy) > 0.1;
    this.motion += (Number(moving) - this.motion) * blend;
    if (Math.abs(this.vx) > 0.1) this.facingRight = this.vx > 0;
    this.look += ((this.facingRight ? 1 : -1) - this.look) * blend;
    this.animTime += seconds;
    this.walkCycle += Math.hypot(this.vx, this.vy) * delta * 0.085;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.recoil *= Math.exp(-22 * seconds);
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    const reduced = this.reduceMotion === true;
    PotatoArt.pose(
      this.rig,
      this.animTime,
      reduced ? 0 : this.motion,
      this.walkCycle,
      this.look,
      this.hitFlash / 150,
    );
    this.blinkTimer -= dt;
    this.blinkLeft = Math.max(0, this.blinkLeft - dt);
    if (this.blinkTimer <= 0) {
      this.blinkTimer = 2300 + Math.random() * 2600;
      this.blinkLeft = 130;
    }
    this.rig.eyes.scale.y = this.blinkLeft > 0 ? 0.12 : 1;
    this.rig.torso.alpha = this.hitFlash > 0 ? 0.82 : 1;
    this.weaponGfx.rotation = this.aimAngle;
    this.weaponGfx.scale.y = Math.cos(this.aimAngle) < 0 ? -1 : 1;
    this.weaponGfx.x = -Math.cos(this.aimAngle) * this.recoil * 5;
    this.weaponGfx.y =
      5 -
      this.motion * Math.abs(Math.cos(this.walkCycle)) * 1.5 -
      Math.sin(this.aimAngle) * this.recoil * 5;
    this.muzzle.visible = !reduced && this.attackAnim > 0;
    this.muzzle.alpha = this.attackAnim / 65;
    if (this.invincible) {
      this.invincibleTimer -= dt;
      this.sprite.alpha =
        0.62 + Math.abs(Math.sin(this.invincibleTimer * 0.018)) * 0.38;
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
    // Hit pose is composed by the rig instead of overwriting its facing.

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

  gainGold(amount) {
    this.stats.gold += amount;
  }

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
    const weapon = {
      id: weaponId,
      ...cfg,
      level: 1,
      cooldown: 0,
      lastFireTime: 0,
    };
    if (this.weapons.length < 4) this.weapons.push(weapon);
    else this.weapons[this.currentWeaponIndex] = weapon;
    this.stats.weaponsUsed.add(weaponId);
    this.currentWeaponIndex = this.weapons.length - 1;
    this.drawWeapon();
  }

  getCurrentWeapon() {
    return this.weapons.length === 0
      ? null
      : this.weapons[this.currentWeaponIndex];
  }

  addItem(itemId) {
    const cfg = CONFIG.ITEMS[itemId];
    if (!cfg) return;
    this.items.push({ id: itemId, ...cfg });
    this.applyItemEffect(cfg.effect);
  }

  applyItemEffect(effect) {
    if (effect.maxHealth) {
      this.maxHealth += effect.maxHealth;
      this.health += effect.maxHealth;
    }
    if (effect.speed) this.speed += effect.speed;
    if (effect.damagePercent) this.damageMultiplier += effect.damagePercent;
    if (effect.fireRatePercent)
      this.fireRateMultiplier += effect.fireRatePercent;
    if (effect.armor) this.armor += effect.armor;
    if (effect.dodge) this.dodge = Math.min(0.5, this.dodge + effect.dodge);
    if (effect.critChance)
      this.critChance = Math.min(0.5, this.critChance + effect.critChance);
    if (effect.lifeSteal) this.lifeSteal += effect.lifeSteal;
    if (effect.pickupRange) this.pickupRange += effect.pickupRange;
    if (effect.luck) this.luck += effect.luck;
  }

  getStats() {
    return {
      ...this.stats,
      level: this.level,
      maxHealth: this.maxHealth,
      speed: this.speed,
      armor: this.armor,
      dodge: this.dodge,
      critChance: this.critChance,
      damageMultiplier: this.damageMultiplier,
      fireRateMultiplier: this.fireRateMultiplier,
      hpRegen: this.hpRegen,
      lifeSteal: this.lifeSteal,
      luck: this.luck,
      pickupRange: this.pickupRange,
      characterName: this.characterName,
    };
  }

  reset() {
    this.revive();
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = CONFIG.PLAYER.XP_PER_LEVEL[0];
    this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
    this.health = this.maxHealth;
    this.speed = CONFIG.PLAYER.SPEED;
    this.armor = 0;
    this.dodge = 0;
    this.critChance = 0;
    this.lifeSteal = 0;
    this.pickupRange = 50;
    this.luck = 0;
    this.hpRegen = 0;
    this.damageMultiplier = 1;
    this.fireRateMultiplier = 1;
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
    this.hitFlash = 0;
    this.animTime = 0;
    this.walkCycle = 0;
    this.weapons = [];
    this.items = [];
    this.stats = {
      kills: 0,
      bossKills: 0,
      damageDealt: 0,
      damageTaken: 0,
      gold: 0,
      wave: 0,
      perfectWave: false,
      weaponsUsed: new Set(),
      timePlayed: 0,
    };
    this.motion = 0;
    this.look = 1;
    this.facingRight = true;
    this.aimAngle = 0;
    this.recoil = 0;
    this.blinkTimer = 1800;
    this.blinkLeft = 0;
    this.attackAnim = 0;
    this.vx = 0;
    this.vy = 0;
    this.invincibleTimer = 0;
    this.sprite.position.set(this.x, this.y);
    this.muzzle.visible = false;
    this.drawCharacter();
  }
}
