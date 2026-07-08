// 游戏配置常量
const CONFIG = {
    // 画布设置
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    BACKGROUND_COLOR: 0x1a1a2e,

    // 游戏区域
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,

    // 玩家设置
    PLAYER: {
        SPEED: 3.5,
        MAX_HEALTH: 100,
        SIZE: 24,
        INVINCIBLE_TIME: 500, // 受伤无敌时间(ms)
        XP_PER_LEVEL: [10, 20, 35, 50, 70, 95, 125, 160, 200, 250], // 每级所需经验
    },

    // 武器配置
    WEAPONS: {
        PISTOL: {
            name: '手枪',
            icon: '🔫',
            damage: 10,
            fireRate: 500, // 射击间隔(ms)
            bulletSpeed: 8,
            bulletSize: 4,
            range: 300,
            spread: 0.05,
            description: '基础武器，稳定输出'
        },
        SHOTGUN: {
            name: '霰弹枪',
            icon: '💥',
            damage: 8,
            fireRate: 800,
            bulletSpeed: 7,
            bulletSize: 3,
            range: 200,
            spread: 0.3,
            pellets: 5,
            description: '近距离散射，伤害爆炸'
        },
        SMG: {
            name: '冲锋枪',
            icon: '🔫',
            damage: 5,
            fireRate: 150,
            bulletSpeed: 9,
            bulletSize: 3,
            range: 250,
            spread: 0.15,
            description: '射速极快，倾泻火力'
        },
        LASER: {
            name: '激光枪',
            icon: '⚡',
            damage: 15,
            fireRate: 300,
            bulletSpeed: 15,
            bulletSize: 2,
            range: 400,
            spread: 0,
            piercing: true,
            description: '穿透射线，直线打击'
        },
        ROCKET: {
            name: '火箭筒',
            icon: '🚀',
            damage: 40,
            fireRate: 1500,
            bulletSpeed: 5,
            bulletSize: 8,
            range: 350,
            spread: 0.02,
            explosionRadius: 60,
            description: '范围爆炸，一击必杀'
        },
        LIGHTNING: {
            name: '电击器',
            icon: '⚡',
            damage: 12,
            fireRate: 600,
            bulletSpeed: 0,
            bulletSize: 0,
            range: 200,
            chainCount: 3,
            chainRange: 100,
            description: '连锁闪电，群体伤害'
        }
    },

    // 敌人配置
    ENEMIES: {
        NORMAL: {
            name: '普通土豆',
            health: 20,
            speed: 1.2,
            damage: 10,
            size: 20,
            xp: 5,
            color: 0x8B7355
        },
        FAST: {
            name: '快速土豆',
            health: 10,
            speed: 2.5,
            damage: 8,
            size: 16,
            xp: 8,
            color: 0x98FB98
        },
        TANK: {
            name: '坦克土豆',
            health: 80,
            speed: 0.8,
            damage: 20,
            size: 30,
            xp: 15,
            color: 0x708090
        },
        RANGED: {
            name: '远程土豆',
            health: 15,
            speed: 1,
            damage: 12,
            size: 18,
            xp: 10,
            color: 0xDDA0DD,
            attackRange: 200,
            projectileSpeed: 4
        },
        EXPLODER: {
            name: '自爆土豆',
            health: 25,
            speed: 1.8,
            damage: 50,
            size: 22,
            xp: 12,
            color: 0xFF6347,
            explosionRadius: 50
        }
    },

    // Boss配置
    BOSSES: {
        GIANT: {
            name: '巨型土豆',
            health: 500,
            speed: 0.6,
            damage: 30,
            size: 60,
            xp: 100,
            color: 0x8B4513,
            phases: [
                { healthPercent: 100, speed: 0.6, attackPattern: 'charge' },
                { healthPercent: 50, speed: 0.8, attackPattern: 'slam' },
                { healthPercent: 25, speed: 1.0, attackPattern: 'rage' }
            ]
        },
        KING: {
            name: '土豆国王',
            health: 800,
            speed: 0.5,
            damage: 25,
            size: 70,
            xp: 200,
            color: 0xFFD700,
            summonInterval: 5000,
            summonCount: 3
        }
    },

    // 波次配置
    WAVES: {
        TOTAL_WAVES: 20,
        BOSS_INTERVAL: 5, // 每5波出现Boss
        SPAWN_INTERVAL: 2000, // 初始刷怪间隔(ms)，随关卡递减
        WAVE_DURATION: 30000, // 每波30秒，时间到清场
        SHOP_TIME: 15000, // 商店时间(ms)
    },

    // 道具稀有度
    RARITY: {
        COMMON: { name: '普通', color: '#aaaaaa', chance: 0.5 },
        RARE: { name: '稀有', color: '#4488ff', chance: 0.3 },
        EPIC: { name: '史诗', color: '#aa44ff', chance: 0.15 },
        LEGENDARY: { name: '传说', color: '#ffd700', chance: 0.05 }
    },

    // 道具配置
    ITEMS: {
        // 属性强化
        HEALTH_UP: { name: '生命强化', icon: '❤️', desc: '最大生命+20', effect: { maxHealth: 20 } },
        SPEED_UP: { name: '速度强化', icon: '👟', desc: '移动速度+0.3', effect: { speed: 0.3 } },
        DAMAGE_UP: { name: '伤害强化', icon: '⚔️', desc: '伤害+15%', effect: { damagePercent: 0.15 } },
        FIRE_RATE_UP: { name: '射速强化', icon: '🔄', desc: '射速+20%', effect: { fireRatePercent: -0.2 } },
        ARMOR_UP: { name: '护甲强化', icon: '🛡️', desc: '护甲+5', effect: { armor: 5 } },
        DODGE_UP: { name: '闪避强化', icon: '💨', desc: '闪避+5%', effect: { dodge: 0.05 } },
        CRIT_UP: { name: '暴击强化', icon: '💥', desc: '暴击率+5%', effect: { critChance: 0.05 } },
        LIFE_STEAL: { name: '生命偷取', icon: '🧛', desc: '击杀回复2生命', effect: { lifeSteal: 2 } },
        MAGNET: { name: '磁铁', icon: '🧲', desc: '拾取范围+50', effect: { pickupRange: 50 } },
        LUCKY: { name: '幸运草', icon: '🍀', desc: '幸运+10', effect: { luck: 10 } },
    },

    // 颜色
    COLORS: {
        PLAYER: 0xFFD700,
        BULLET: 0xFFFF00,
        ENEMY_BULLET: 0xFF4444,
        XP_ORB: 0x00FFFF,
        GOLD: 0xFFD700,
        HEALTH_DROP: 0xFF6B6B,
    },

    // 粒子效果
    PARTICLES: {
        HIT_COUNT: 5,
        DEATH_COUNT: 10,
        XP_COLLECT_COUNT: 3,
    }
};

// 游戏状态枚举
const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    SHOP: 'SHOP',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    LEVEL_UP: 'LEVEL_UP'
};

// 成就配置
const ACHIEVEMENTS = [
    { id: 'first_kill', name: '初出茅庐', desc: '击杀第一个敌人', icon: '⚔️', condition: (stats) => stats.kills >= 1 },
    { id: 'kill_100', name: '百人斩', desc: '累计击杀100个敌人', icon: '💀', condition: (stats) => stats.kills >= 100 },
    { id: 'kill_500', name: '千人斩', desc: '累计击杀500个敌人', icon: '☠️', condition: (stats) => stats.kills >= 500 },
    { id: 'wave_5', name: '小有成就', desc: '存活到第5波', icon: '🌊', condition: (stats) => stats.wave >= 5 },
    { id: 'wave_10', name: '身经百战', desc: '存活到第10波', icon: '🏆', condition: (stats) => stats.wave >= 10 },
    { id: 'wave_20', name: '生存专家', desc: '存活到第20波', icon: '👑', condition: (stats) => stats.wave >= 20 },
    { id: 'boss_kill', name: '屠龙勇士', desc: '击杀第一个Boss', icon: '🐉', condition: (stats) => stats.bossKills >= 1 },
    { id: 'no_damage', name: '完美闪避', desc: '一整波不受伤害', icon: '✨', condition: (stats) => stats.perfectWave },
    { id: 'speed_run', name: '速通高手', desc: '5分钟内通关5波', icon: '⏱️', condition: (stats) => stats.speedRun },
    { id: 'rich', name: '财大气粗', desc: '持有500金币', icon: '💰', condition: (stats) => stats.gold >= 500 },
    { id: 'level_10', name: '满级达人', desc: '达到10级', icon: '⭐', condition: (stats) => stats.level >= 10 },
    { id: 'all_weapons', name: '武器大师', desc: '在一局中使用过所有武器', icon: '🔫', condition: (stats) => stats.weaponsUsed >= 6 },
];
