// 成就UI系统
class AchievementsUI {
    constructor(game) {
        this.game = game;
        this.notificationQueue = [];
        this.currentNotification = null;
        this.notificationTimer = 0;
        this.notificationDuration = 3000; // 3秒显示时间

        // 创建通知元素
        this.createNotificationElement();
    }

    // 创建通知元素
    createNotificationElement() {
        this.notificationElement = document.createElement('div');
        this.notificationElement.className = 'achievement-notification';
        this.notificationElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #2a2a4a, #3a3a5a);
            border: 3px solid #ffd700;
            border-radius: 10px;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.5s ease;
            pointer-events: none;
        `;
        document.body.appendChild(this.notificationElement);
    }

    // 添加成就通知
    addNotification(achievement) {
        this.notificationQueue.push(achievement);
        if (!this.currentNotification) {
            this.showNextNotification();
        }
    }

    // 显示下一个通知
    showNextNotification() {
        if (this.notificationQueue.length === 0) {
            this.currentNotification = null;
            return;
        }

        this.currentNotification = this.notificationQueue.shift();
        this.notificationTimer = this.notificationDuration;

        // 更新通知内容
        this.notificationElement.innerHTML = `
            <div style="font-size: 2rem;">${this.currentNotification.icon}</div>
            <div>
                <div style="color: #ffd700; font-weight: bold; margin-bottom: 5px;">成就解锁!</div>
                <div style="color: #fff; font-size: 1.1rem;">${this.currentNotification.name}</div>
            </div>
        `;

        // 显示通知
        this.notificationElement.style.transform = 'translateX(0)';

        // 3秒后隐藏
        setTimeout(() => {
            this.notificationElement.style.transform = 'translateX(400px)';
            setTimeout(() => {
                this.showNextNotification();
            }, 500);
        }, this.notificationDuration);
    }

    // 更新成就系统
    update(stats) {
        // 检查成就
        this.game.achievements.checkAchievements(stats);

        // 获取并显示新解锁的成就
        const notification = this.game.achievements.getNotification();
        if (notification) {
            this.addNotification(notification);
        }
    }

    // 清理通知
    cleanup() {
        if (this.notificationElement && this.notificationElement.parentNode) {
            this.notificationElement.parentNode.removeChild(this.notificationElement);
        }
    }
}
