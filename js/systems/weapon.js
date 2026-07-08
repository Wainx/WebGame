// 武器系统
class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.lastFireTime = 0;
    }

    // 更新武器系统
    update(delta, player, enemies, bosses) {
        const weapon = player.getCurrentWeapon();
        if (!weapon) return;

        // 更新冷却
        if (weapon.lastFireTime > 0) {
            weapon.lastFireTime -= delta * 16.67;
        }

        // 自动射击
        if (weapon.lastFireTime <= 0) {
            this.fire(player, weapon, enemies, bosses);
        }
    }

    // 射击
    fire(player, weapon, enemies, bosses) {
        // 找到最近的敌人
        const target = this.findNearestTarget(player, enemies, bosses);
        if (!target) return;

        // 计算射击角度
        const angle = MathUtils.angle(player.x, player.y, target.x, target.y);

        // 计算伤害（包含暴击）
        let damage = weapon.damage * player.damageMultiplier;
        const isCrit = Math.random() < player.critChance;
        if (isCrit) {
            damage *= 2;
        }

        // 根据武器类型处理射击
        switch (weapon.id) {
            case 'PISTOL':
                this.firePistol(player, angle, damage, weapon);
                break;
            case 'SHOTGUN':
                this.fireShotgun(player, angle, damage, weapon);
                break;
            case 'SMG':
                this.fireSMG(player, angle, damage, weapon);
                break;
            case 'LASER':
                this.fireLaser(player, angle, damage, weapon);
                break;
            case 'ROCKET':
                this.fireRocket(player, angle, damage, weapon);
                break;
            case 'LIGHTNING':
                this.fireLightning(player, damage, weapon, enemies, bosses);
                break;
        }

        // 重置冷却
        const fireRate = weapon.fireRate * player.fireRateMultiplier;
        weapon.lastFireTime = fireRate;
        this.lastFireTime = Date.now();
    }

    // 手枪射击
    firePistol(player, angle, damage, weapon) {
        this.game.createBullet(
            player.x,
            player.y,
            angle,
            {
                damage: damage,
                bulletSpeed: weapon.bulletSpeed,
                bulletSize: weapon.bulletSize,
                piercing: false
            }
        );
    }

    // 霰弹枪射击
    fireShotgun(player, angle, damage, weapon) {
        const pellets = weapon.pellets || 5;
        const spread = weapon.spread;

        for (let i = 0; i < pellets; i++) {
            const pelletAngle = angle + (Math.random() - 0.5) * spread * 2;
            this.game.createBullet(
                player.x,
                player.y,
                pelletAngle,
                {
                    damage: damage * 0.8,
                    bulletSpeed: weapon.bulletSpeed + Math.random() * 2 - 1,
                    bulletSize: weapon.bulletSize,
                    piercing: false
                }
            );
        }
    }

    // 冲锋枪射击
    fireSMG(player, angle, damage, weapon) {
        const spread = weapon.spread;
        const bulletAngle = angle + (Math.random() - 0.5) * spread;

        this.game.createBullet(
            player.x,
            player.y,
            bulletAngle,
            {
                damage: damage,
                bulletSpeed: weapon.bulletSpeed,
                bulletSize: weapon.bulletSize,
                piercing: false
            }
        );
    }

    // 激光枪射击
    fireLaser(player, angle, damage, weapon) {
        this.game.createBullet(
            player.x,
            player.y,
            angle,
            {
                damage: damage,
                bulletSpeed: weapon.bulletSpeed,
                bulletSize: weapon.bulletSize,
                piercing: true
            }
        );
    }

    // 火箭筒射击
    fireRocket(player, angle, damage, weapon) {
        this.game.createBullet(
            player.x,
            player.y,
            angle,
            {
                damage: damage,
                bulletSpeed: weapon.bulletSpeed,
                bulletSize: weapon.bulletSize,
                explosionRadius: weapon.explosionRadius
            }
        );
    }

    // 电击器射击
    fireLightning(player, damage, weapon, enemies, bosses) {
        const range = weapon.range;
        const chainCount = weapon.chainCount || 3;
        const chainRange = weapon.chainRange || 100;

        // 找到范围内的所有敌人
        const targets = this.findTargetsInRange(player.x, player.y, range, enemies, bosses);

        if (targets.length === 0) return;

        // 选择第一个目标
        const firstTarget = targets[0];
        const hitTargets = [firstTarget];

        // 造成伤害
        this.game.damageEnemy(firstTarget, damage);

        // 连锁闪电
        let currentTarget = firstTarget;
        for (let i = 0; i < chainCount - 1; i++) {
            const nextTarget = this.findNearestUnhitTarget(
                currentTarget.x,
                currentTarget.y,
                chainRange,
                hitTargets,
                enemies,
                bosses
            );

            if (!nextTarget) break;

            hitTargets.push(nextTarget);
            this.game.damageEnemy(nextTarget, damage * 0.7);

            // 创建闪电效果
            this.game.createLightning(
                currentTarget.x,
                currentTarget.y,
                nextTarget.x,
                nextTarget.y
            );

            currentTarget = nextTarget;
        }

        // 创建主闪电效果
        this.game.createLightning(
            player.x,
            player.y,
            firstTarget.x,
            firstTarget.y,
            hitTargets.slice(1).map(t => ({
                x1: hitTargets[hitTargets.indexOf(t) - 1].x,
                y1: hitTargets[hitTargets.indexOf(t) - 1].y,
                x2: t.x,
                y2: t.y
            }))
        );
    }

    // 找到最近的目标
    findNearestTarget(player, enemies, bosses) {
        let nearest = null;
        let minDist = Infinity;

        // 检查普通敌人
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = MathUtils.distance(player.x, player.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        // 检查Boss
        for (const boss of bosses) {
            if (!boss.active) continue;
            const dist = MathUtils.distance(player.x, player.y, boss.x, boss.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = boss;
            }
        }

        return nearest;
    }

    // 找到范围内的目标
    findTargetsInRange(x, y, range, enemies, bosses) {
        const targets = [];

        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = MathUtils.distance(x, y, enemy.x, enemy.y);
            if (dist <= range) {
                enemy._dist = dist;
                targets.push(enemy);
            }
        }

        for (const boss of bosses) {
            if (!boss.active) continue;
            const dist = MathUtils.distance(x, y, boss.x, boss.y);
            if (dist <= range) {
                boss._dist = dist;
                targets.push(boss);
            }
        }

        // 按距离排序
        targets.sort((a, b) => a._dist - b._dist);
        return targets;
    }

    // 找到最近的未击中目标
    findNearestUnhitTarget(x, y, range, hitTargets, enemies, bosses) {
        let nearest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active || hitTargets.includes(enemy)) continue;
            const dist = MathUtils.distance(x, y, enemy.x, enemy.y);
            if (dist <= range && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        for (const boss of bosses) {
            if (!boss.active || hitTargets.includes(boss)) continue;
            const dist = MathUtils.distance(x, y, boss.x, boss.y);
            if (dist <= range && dist < minDist) {
                minDist = dist;
                nearest = boss;
            }
        }

        return nearest;
    }

    // 升级武器
    upgradeWeapon(weapon) {
        weapon.level++;
        weapon.damage *= 1.2;
        weapon.fireRate *= 0.9;
        return weapon;
    }
}
