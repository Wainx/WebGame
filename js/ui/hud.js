// HUD管理系统
class HUD {
    constructor(game) {
        this.game = game;

        // 获取UI元素
        this.waveNumber = document.getElementById('wave-number');
        this.waveTimer = document.getElementById('wave-timer');
        this.enemyCount = document.getElementById('enemy-count');
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.xpFill = document.getElementById('xp-fill');
        this.levelText = document.getElementById('level-text');
        this.weaponName = document.getElementById('weapon-name');
        this.weaponLevel = document.getElementById('weapon-level');
        this.itemsContainer = document.getElementById('items-container');
    }

    // 更新HUD显示
    update(player, waveInfo, enemyCount) {
        // 更新波次信息
        this.waveNumber.textContent = waveInfo.wave;
        this.waveTimer.textContent = waveInfo.timeLeft !== undefined ? waveInfo.timeLeft : Math.max(0, waveInfo.duration - waveInfo.timer);
        this.enemyCount.textContent = enemyCount;

        // 更新生命值
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.healthFill.style.width = `${healthPercent}%`;
        this.healthText.textContent = `${Math.floor(player.health)}/${player.maxHealth}`;

        // 更新经验值
        const xpPercent = (player.xp / player.xpToNextLevel) * 100;
        this.xpFill.style.width = `${xpPercent}%`;
        this.levelText.textContent = `Lv.${player.level}`;

        // 更新武器信息
        const currentWeapon = player.getCurrentWeapon();
        if (currentWeapon) {
            this.weaponName.textContent = currentWeapon.name;
            this.weaponLevel.textContent = `Lv.${currentWeapon.level}`;
        }

        // 更新道具栏
        this.updateItems(player.items);
    }

    // 更新道具显示
    updateItems(items) {
        this.itemsContainer.innerHTML = '';

        for (let i = 0; i < 8; i++) {
            const slot = document.createElement('div');
            slot.className = 'item-slot';

            if (i < items.length) {
                slot.textContent = items[i].icon;
                slot.title = `${items[i].name}: ${items[i].desc}`;
            }

            this.itemsContainer.appendChild(slot);
        }
    }

    // 显示HUD
    show() {
        document.getElementById('game-hud').classList.remove('hidden');
    }

    // 隐藏HUD
    hide() {
        document.getElementById('game-hud').classList.add('hidden');
    }
}
