// 商店系统
class ShopSystem {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.shopTimer = 0;
        this.shopDuration = CONFIG.WAVES.SHOP_TIME;
        this.isActive = false;

        this.shopItemsContainer = document.getElementById('shop-items-container');
        this.goldAmount = document.getElementById('gold-amount');
        this.shopTimerElement = document.getElementById('shop-timer');
    }

    // 打开商店
    open(player) {
        this.isActive = true;
        this.shopTimer = this.shopDuration;

        // 生成商店道具
        this.items = this.game.items.generateShopItems(player, 6);

        // 显示商店界面
        this.render(player);
        document.getElementById('shop-screen').classList.remove('hidden');
    }

    // 关闭商店
    close() {
        this.isActive = false;
        document.getElementById('shop-screen').classList.add('hidden');
    }

    // 渲染商店
    render(player) {
        this.shopItemsContainer.innerHTML = '';
        this.goldAmount.textContent = player.stats.gold;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const itemElement = this.createItemElement(item, player, i);
            this.shopItemsContainer.appendChild(itemElement);
        }
    }

    // 创建道具元素
    createItemElement(item, player, index) {
        const rarityClass = `rarity-${item.rarity.toLowerCase()}`;
        const canAfford = player.stats.gold >= item.price;

        const element = document.createElement('div');
        element.className = `shop-item ${rarityClass}`;
        element.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.description}</div>
            <div class="shop-item-price">💰 ${item.price}</div>
        `;

        if (canAfford) {
            element.addEventListener('click', () => {
                this.buyItem(item, player, index);
            });
        } else {
            element.style.opacity = '0.5';
            element.style.cursor = 'not-allowed';
        }

        return element;
    }

    // 购买道具
    buyItem(item, player, index) {
        if (player.stats.gold < item.price) return;

        // 扣除金币
        player.stats.gold -= item.price;

        // 应用道具效果
        if (item.type === 'weapon') {
            player.equipWeapon(item.id);
        } else {
            player.addItem(item.id);
        }

        // 移除已购买的道具
        this.items.splice(index, 1);

        // 重新渲染
        this.render(player);

        // 创建购买特效
        this.game.particles.emit(player.x, player.y, 10, CONFIG.COLORS.GOLD, 4, 500);
    }

    // 更新商店计时器
    update(delta) {
        if (!this.isActive) return;

        this.shopTimer -= delta * 16.67;
        this.shopTimerElement.textContent = Math.ceil(this.shopTimer / 1000);

        // 时间到自动关闭
        if (this.shopTimer <= 0) {
            this.game.closeShop();
        }
    }

    // 检查商店是否激活
    isOpen() {
        return this.isActive;
    }

    // 重置商店
    reset() {
        this.items = [];
        this.isActive = false;
    }
}
