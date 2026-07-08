// 数学工具函数
const MathUtils = {
    // 两点之间距离
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // 两点之间角度
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // 线性插值
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // 限制值在范围内
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // 随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 随机浮点数
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    // 随机选择数组中的元素
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // 根据权重随机选择
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        return items[items.length - 1];
    },

    // 检查两个圆是否碰撞
    circleCollision(x1, y1, r1, x2, y2, r2) {
        const distance = this.distance(x1, y1, x2, y2);
        return distance < r1 + r2;
    },

    // 检查点是否在矩形内
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    // 角度转方向向量
    angleToDirection(angle) {
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
    },

    // 归一化向量
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },

    // 生成随机颜色
    randomColor() {
        return Math.floor(Math.random() * 16777215);
    },

    // 根据稀有度随机选择
    randomRarity() {
        const rand = Math.random();
        if (rand < CONFIG.RARITY.LEGENDARY.chance) return 'LEGENDARY';
        if (rand < CONFIG.RARITY.LEGENDARY.chance + CONFIG.RARITY.EPIC.chance) return 'EPIC';
        if (rand < CONFIG.RARITY.LEGENDARY.chance + CONFIG.RARITY.EPIC.chance + CONFIG.RARITY.RARE.chance) return 'RARE';
        return 'COMMON';
    },

    // 平滑阻尼
    smoothDamp(current, target, velocity, smoothTime, deltaTime) {
        const omega = 2 / smoothTime;
        const x = omega * deltaTime;
        const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
        const change = current - target;
        const temp = (velocity + omega * change) * deltaTime;
        const newVelocity = (velocity - omega * temp) * exp;
        const newValue = target + (change + temp) * exp;
        return { value: newValue, velocity: newVelocity };
    }
};
