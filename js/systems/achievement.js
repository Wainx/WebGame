// 成就系统
class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.achievements = [];
        this.unlockedAchievements = new Set();
        this.pendingNotifications = [];

        // 初始化成就
        this.initAchievements();

        // 加载已解锁的成就
        this.loadAchievements();
    }

    // 初始化成就列表
    initAchievements() {
        this.achievements = ACHIEVEMENTS.map(achievement => ({
            ...achievement,
            unlocked: false
        }));
    }

    // 从本地存储加载成就
    loadAchievements() {
        try {
            const saved = localStorage.getItem('potato_brothers_achievements');
            if (saved) {
                const unlocked = JSON.parse(saved);
                unlocked.forEach(id => {
                    this.unlockedAchievements.add(id);
                    const achievement = this.achievements.find(a => a.id === id);
                    if (achievement) {
                        achievement.unlocked = true;
                    }
                });
            }
        } catch (e) {
            console.log('无法加载成就数据');
        }
    }

    // 保存成就到本地存储
    saveAchievements() {
        try {
            const unlocked = Array.from(this.unlockedAchievements);
            localStorage.setItem('potato_brothers_achievements', JSON.stringify(unlocked));
        } catch (e) {
            console.log('无法保存成就数据');
        }
    }

    // 检查成就
    checkAchievements(stats) {
        for (const achievement of this.achievements) {
            if (achievement.unlocked) continue;

            // 检查条件
            if (achievement.condition(stats)) {
                this.unlockAchievement(achievement);
            }
        }
    }

    // 解锁成就
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        this.unlockedAchievements.add(achievement.id);
        this.saveAchievements();

        // 添加通知
        this.pendingNotifications.push({
            name: achievement.name,
            icon: achievement.icon,
            time: Date.now()
        });

        console.log(`成就解锁: ${achievement.name}`);
    }

    // 获取通知
    getNotification() {
        if (this.pendingNotifications.length === 0) return null;

        const notification = this.pendingNotifications[0];
        if (Date.now() - notification.time > 3000) {
            this.pendingNotifications.shift();
            return null;
        }

        return notification;
    }

    // 获取所有成就
    getAllAchievements() {
        return this.achievements;
    }

    // 获取已解锁成就数量
    getUnlockedCount() {
        return this.unlockedAchievements.size;
    }

    // 获取总成就数量
    getTotalCount() {
        return this.achievements.length;
    }

    // 重置成就（新游戏时保留成就）
    reset() {
        this.pendingNotifications = [];
    }
}
