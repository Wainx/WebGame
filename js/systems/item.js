// 道具系统
class ItemSystem {
    constructor(game) {
        this.game = game;

        // 掉落物
        this.drops = [];
        this.dropContainer = new PIXI.Container();
        game.worldContainer.addChild(this.dropContainer);

        // 经验值球
        this.xpOrbs = [];
        this.xpContainer = new PIXI.Container();
        game.worldContainer.addChild(this.xpContainer);
    }

    // 创建掉落物
    createDrop(x, y, type, value) {
        const drop = {
            x: x,
            y: y,
            type: type, // 'xp', 'gold', 'health'
            value: value,
            sprite: new PIXI.Graphics(),
            lifetime: 15000, // 15秒后消失
            magnetized: false,
            active: true
        };

        // 绘制掉落物
        this.drawDrop(drop);

        drop.sprite.x = x;
        drop.sprite.y = y;
        this.dropContainer.addChild(drop.sprite);
        this.drops.push(drop);

        return drop;
    }

    drawDrop(drop) {
        drop.sprite.clear();

        switch (drop.type) {
            case 'xp':
                drop.sprite.beginFill(CONFIG.COLORS.XP_ORB);
                drop.sprite.drawCircle(0, 0, 5);
                drop.sprite.endFill();
                drop.sprite.beginFill(0xFFFFFF, 0.5);
                drop.sprite.drawCircle(0, 0, 2);
                drop.sprite.endFill();
                break;

            case 'gold':
                drop.sprite.beginFill(CONFIG.COLORS.GOLD);
                drop.sprite.drawCircle(0, 0, 6);
                drop.sprite.endFill();
                drop.sprite.beginFill(0xFFA500);
                drop.sprite.drawCircle(0, 0, 3);
                drop.sprite.endFill();
                break;

            case 'health':
                drop.sprite.beginFill(CONFIG.COLORS.HEALTH_DROP);
                // 绘制十字形
                drop.sprite.drawRect(-2, -5, 4, 10);
                drop.sprite.drawRect(-5, -2, 10, 4);
                drop.sprite.endFill();
                break;
        }
    }

    // 创建经验球
    createXPOrb(x, y, value) {
        return this.createDrop(x, y, 'xp', value);
    }

    // 创建金币掉落
    createGoldDrop(x, y, value) {
        return this.createDrop(x, y, 'gold', value);
    }

    // 创建生命恢复掉落
    createHealthDrop(x, y, value) {
        return this.createDrop(x, y, 'health', value);
    }

    // 更新掉落物
    update(delta, player) {
        // 更新掉落物
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            if (!drop.active) continue;

            // 更新生命周期
            drop.lifetime -= delta * 16.67;
            if (drop.lifetime <= 0) {
                this.removeDrop(drop, i);
                continue;
            }

            // 闪烁效果（即将消失时）
            if (drop.lifetime < 3000) {
                drop.sprite.alpha = Math.sin(drop.lifetime * 0.01) * 0.5 + 0.5;
            }

            // 计算与玩家的距离
            const dist = MathUtils.distance(drop.x, drop.y, player.x, player.y);

            // 磁铁效果
            if (dist < player.pickupRange) {
                drop.magnetized = true;
            }

            // 被吸引时移动向玩家
            if (drop.magnetized) {
                const angle = MathUtils.angle(drop.x, drop.y, player.x, player.y);
                const speed = 8;
                drop.x += Math.cos(angle) * speed;
                drop.y += Math.sin(angle) * speed;
                drop.sprite.x = drop.x;
                drop.sprite.y = drop.y;
            }

            // 拾取检测
            if (dist < player.size + 10) {
                this.collectDrop(drop, player);
                this.removeDrop(drop, i);
            }

            // 浮动动画
            drop.sprite.y = drop.y + Math.sin(Date.now() * 0.003 + i) * 2;
        }
    }

    // 拾取掉落物
    collectDrop(drop, player) {
        switch (drop.type) {
            case 'xp':
                player.gainXP(drop.value);
                this.game.particles.emit(drop.x, drop.y, 3, CONFIG.COLORS.XP_ORB, 2, 300);
                break;

            case 'gold':
                player.gainGold(drop.value);
                this.game.particles.emit(drop.x, drop.y, 3, CONFIG.COLORS.GOLD, 2, 300);
                break;

            case 'health':
                player.heal(drop.value);
                this.game.particles.emit(drop.x, drop.y, 3, CONFIG.COLORS.HEALTH_DROP, 2, 300);
                break;
        }
    }

    // 移除掉落物
    removeDrop(drop, index) {
        drop.active = false;
        this.dropContainer.removeChild(drop.sprite);
        this.drops.splice(index, 1);
    }

    // 生成商店道具选项
    generateShopItems(player, count = 6) {
        const items = [];
        const allItems = Object.keys(CONFIG.ITEMS);
        const allWeapons = Object.keys(CONFIG.WEAPONS);

        for (let i = 0; i < count; i++) {
            // 随机决定是武器还是属性道具
            const isWeapon = Math.random() < 0.3 && player.weapons.length < 4;

            if (isWeapon) {
                // 选择武器
                const weaponId = MathUtils.randomChoice(allWeapons);
                const weaponConfig = CONFIG.WEAPONS[weaponId];
                const rarity = MathUtils.randomRarity();

                items.push({
                    type: 'weapon',
                    id: weaponId,
                    name: weaponConfig.name,
                    icon: weaponConfig.icon,
                    description: weaponConfig.description,
                    rarity: rarity,
                    price: this.getItemPrice(rarity),
                    effect: weaponConfig
                });
            } else {
                // 选择属性道具
                const itemId = MathUtils.randomChoice(allItems);
                const itemConfig = CONFIG.ITEMS[itemId];
                const rarity = MathUtils.randomRarity();

                items.push({
                    type: 'item',
                    id: itemId,
                    name: itemConfig.name,
                    icon: itemConfig.icon,
                    description: itemConfig.desc,
                    rarity: rarity,
                    price: this.getItemPrice(rarity),
                    effect: itemConfig.effect
                });
            }
        }

        return items;
    }

    // 获取道具价格
    getItemPrice(rarity) {
        const prices = {
            'COMMON': 10,
            'RARE': 25,
            'EPIC': 50,
            'LEGENDARY': 100
        };
        return prices[rarity] || 10;
    }

    // 生成升级选项
    generateLevelUpOptions(player, count = 3) {
        const options = [];
        const allItems = Object.keys(CONFIG.ITEMS);

        // 确保不重复
        const availableItems = allItems.filter(id => !options.find(o => o.id === id));

        for (let i = 0; i < count && availableItems.length > 0; i++) {
            const index = Math.floor(Math.random() * availableItems.length);
            const itemId = availableItems[index];
            const itemConfig = CONFIG.ITEMS[itemId];

            options.push({
                id: itemId,
                name: itemConfig.name,
                icon: itemConfig.icon,
                description: itemConfig.desc,
                effect: itemConfig.effect
            });

            availableItems.splice(index, 1);
        }

        return options;
    }

    // 清理所有掉落物
    clearAll() {
        for (const drop of this.drops) {
            this.dropContainer.removeChild(drop.sprite);
        }
        this.drops = [];
    }

    // 重置道具系统
    reset() {
        this.clearAll();
    }
}
