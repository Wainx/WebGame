// 碰撞检测系统
class CollisionSystem {
    constructor(game) {
        this.game = game;
        this.gridSize = 100; // 空间网格大小
        this.grid = {};
    }

    // 更新碰撞检测
    update(delta, player, enemies, bosses, bullets) {
        // 构建空间网格
        this.buildGrid(enemies, bosses);

        // 玩家子弹 vs 敌人
        this.checkBulletsVsEnemies(player, bullets, enemies, bosses);

        // 敌人 vs 玩家
        this.checkEnemiesVsPlayer(player, enemies);

        // Boss vs 玩家
        this.checkBossesVsPlayer(player, bosses);

        // 敌人子弹 vs 玩家
        this.checkEnemyBulletsVsPlayer(player, bullets);
    }

    // 构建空间网格
    buildGrid(enemies, bosses) {
        this.grid = {};

        // 添加敌人到网格
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const cellX = Math.floor(enemy.x / this.gridSize);
            const cellY = Math.floor(enemy.y / this.gridSize);
            const key = `${cellX},${cellY}`;

            if (!this.grid[key]) {
                this.grid[key] = [];
            }
            this.grid[key].push(enemy);
        }

        // 添加Boss到网格
        for (const boss of bosses) {
            if (!boss.active) continue;
            const cellX = Math.floor(boss.x / this.gridSize);
            const cellY = Math.floor(boss.y / this.gridSize);
            const key = `${cellX},${cellY}`;

            if (!this.grid[key]) {
                this.grid[key] = [];
            }
            this.grid[key].push(boss);
        }
    }

    // 获取附近的目标
    getNearbyTargets(x, y, radius) {
        const targets = [];
        const cellRadius = Math.ceil(radius / this.gridSize);

        const centerCellX = Math.floor(x / this.gridSize);
        const centerCellY = Math.floor(y / this.gridSize);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerCellX + dx},${centerCellY + dy}`;
                if (this.grid[key]) {
                    targets.push(...this.grid[key]);
                }
            }
        }

        return targets;
    }

    // 玩家子弹 vs 敌人
    checkBulletsVsEnemies(player, bullets, enemies, bosses) {
        for (const bullet of bullets) {
            if (!bullet.active || bullet.isEnemy) continue;

            // 获取附近的敌人
            const nearbyTargets = this.getNearbyTargets(bullet.x, bullet.y, 50);

            for (const target of nearbyTargets) {
                if (!target.active) continue;

                // 检查碰撞
                const dist = MathUtils.distance(bullet.x, bullet.y, target.x, target.y);
                const hitDist = bullet.size + target.size;

                if (dist < hitDist) {
                    // 检查是否已经命中过（穿透弹）
                    if (bullet.hit(target)) {
                        // 计算击退方向
                        const angle = MathUtils.angle(bullet.x, bullet.y, target.x, target.y);
                        const knockbackX = -Math.cos(angle) * 5;
                        const knockbackY = -Math.sin(angle) * 5;

                        // 造成伤害
                        const killed = this.game.damageEnemy(target, bullet.damage, knockbackX, knockbackY);

                        // 火箭弹爆炸效果
                        if (bullet.explosionRadius > 0) {
                            this.handleExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage * 0.5, enemies, bosses);
                        }

                        // 创建命中粒子
                        this.game.particles.emit(bullet.x, bullet.y, 5, 0xFFFF00, 3, 200);

                        // 生命偷取
                        if (killed && player.lifeSteal > 0) {
                            player.heal(player.lifeSteal);
                        }
                    }
                }
            }
        }
    }

    // 处理爆炸
    handleExplosion(x, y, radius, damage, enemies, bosses) {
        // 创建爆炸粒子
        this.game.particles.emit(x, y, 20, 0xFF4500, 5, 500);

        // 对范围内所有敌人造成伤害
        const targets = this.getNearbyTargets(x, y, radius);
        for (const target of targets) {
            if (!target.active) continue;

            const dist = MathUtils.distance(x, y, target.x, target.y);
            if (dist < radius) {
                const damageMult = 1 - (dist / radius) * 0.5; // 距离越远伤害越低
                this.game.damageEnemy(target, damage * damageMult);
            }
        }
    }

    // 敌人 vs 玩家
    checkEnemiesVsPlayer(player, enemies) {
        if (!player.alive || player.invincible) return;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = MathUtils.distance(player.x, player.y, enemy.x, enemy.y);
            const hitDist = player.size + enemy.size;

            if (dist < hitDist) {
                // 自爆敌人特殊处理
                if (enemy.type === 'EXPLODER' && !enemy.exploding) {
                    enemy.exploding = true;
                    enemy.explosionTimer = 500;
                    continue;
                }

                // 造成伤害
                const damaged = player.takeDamage(enemy.damage);
                if (damaged) {
                    // 击退玩家
                    const angle = MathUtils.angle(enemy.x, enemy.y, player.x, player.y);
                    player.x += Math.cos(angle) * 10;
                    player.y += Math.sin(angle) * 10;

                    // 创建受伤粒子
                    this.game.particles.emit(player.x, player.y, 8, 0xFF0000, 4, 300);

                    // 屏幕震动
                    this.game.camera.shake(5, 100);
                }
            }
        }
    }

    // Boss vs 玩家
    checkBossesVsPlayer(player, bosses) {
        if (!player.alive || player.invincible) return;

        for (const boss of bosses) {
            if (!boss.active) continue;

            const dist = MathUtils.distance(player.x, player.y, boss.x, boss.y);
            const hitDist = player.size + boss.size;

            if (dist < hitDist) {
                const damaged = player.takeDamage(boss.damage);
                if (damaged) {
                    // 击退玩家
                    const angle = MathUtils.angle(boss.x, boss.y, player.x, player.y);
                    player.x += Math.cos(angle) * 15;
                    player.y += Math.sin(angle) * 15;

                    this.game.particles.emit(player.x, player.y, 10, 0xFF0000, 5, 400);
                    this.game.camera.shake(8, 150);
                }
            }

            // Boss冲锋碰撞
            if (boss.charging && dist < hitDist * 1.5) {
                const damaged = player.takeDamage(boss.damage * 2);
                if (damaged) {
                    this.game.camera.shake(15, 300);
                }
            }
        }
    }

    // 敌人子弹 vs 玩家
    checkEnemyBulletsVsPlayer(player, bullets) {
        if (!player.alive || player.invincible) return;

        for (const bullet of bullets) {
            if (!bullet.active || !bullet.isEnemy) continue;

            const dist = MathUtils.distance(bullet.x, bullet.y, player.x, player.y);
            if (dist < bullet.size + player.size) {
                const damaged = player.takeDamage(bullet.damage);
                if (damaged) {
                    bullet.deactivate();
                    this.game.particles.emit(player.x, player.y, 5, 0xFF0000, 3, 200);
                    this.game.camera.shake(5, 100);
                }
            }
        }
    }

    // 重置碰撞系统
    reset() {
        this.grid = {};
    }
}
