// 升级选择界面
class LevelUpUI {
    constructor(game) {
        this.game = game;
        this.options = [];
        this.isActive = false;

        this.optionsContainer = document.getElementById('levelup-options-container');
    }

    // 打开升级选择
    open(player) {
        this.isActive = true;

        // 生成升级选项
        this.options = this.game.items.generateLevelUpOptions(player, 3);

        // 渲染选项
        this.render(player);

        // 显示界面
        document.getElementById('levelup-screen').classList.remove('hidden');

        // 暂停游戏
        this.game.pauseGame();
    }

    // 关闭升级选择
    close() {
        this.isActive = false;
        document.getElementById('levelup-screen').classList.add('hidden');

        // 继续游戏
        this.game.resumeGame();
    }

    // 渲染选项
    render(player) {
        this.optionsContainer.innerHTML = '';

        for (let i = 0; i < this.options.length; i++) {
            const option = this.options[i];
            const optionElement = this.createOptionElement(option, i);
            this.optionsContainer.appendChild(optionElement);
        }
    }

    // 创建选项元素
    createOptionElement(option, index) {
        const element = document.createElement('div');
        element.className = 'levelup-option';
        element.innerHTML = `
            <div class="levelup-option-icon">${option.icon}</div>
            <div class="levelup-option-name">${option.name}</div>
            <div class="levelup-option-desc">${option.description}</div>
        `;

        element.addEventListener('click', () => {
            this.selectOption(option);
        });

        return element;
    }

    // 选择选项
    selectOption(option) {
        const player = this.game.player;

        // 应用效果
        player.addItem(option.id);

        // 创建升级特效
        this.game.particles.emit(player.x, player.y, 20, 0x00FFFF, 5, 800);

        // 关闭界面
        this.close();
    }

    // 检查是否激活
    isOpen() {
        return this.isActive;
    }

    // 重置
    reset() {
        this.options = [];
        this.isActive = false;
    }
}
