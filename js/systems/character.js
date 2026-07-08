// 角色系统 - 基于Brotato(土豆兄弟)的角色设计
const CHARACTERS = {
    WELL_ROUNDED: {
        id: 'WELL_ROUNDED',
        name: '全能者',
        icon: '🥔',
        desc: '平衡型角色，适合新手',
        color: 0xFFD700,
        stats: {
            maxHealth: 100,
            speed: 3.5,
            damageMultiplier: 1.0,
            attackSpeed: 1.0,
            critChance: 0,
            armor: 0,
            dodge: 0,
            lifeSteal: 0,
            hpRegen: 0,
            luck: 0,
            pickupRange: 50
        },
        startWeapon: 'PISTOL',
        passive: null
    },
    WARRIOR: {
        id: 'WARRIOR',
        name: '战士',
        icon: '⚔️',
        desc: '高伤高甲，移速较慢',
        color: 0xFF4444,
        stats: {
            maxHealth: 120,
            speed: 3.0,
            damageMultiplier: 1.2,
            attackSpeed: 0.9,
            critChance: 0,
            armor: 5,
            dodge: 0,
            lifeSteal: 0,
            hpRegen: 0,
            luck: 0,
            pickupRange: 40
        },
        startWeapon: 'SHOTGUN',
        passive: { type: 'low_hp_damage', threshold: 0.3, bonus: 0.3, desc: '生命低于30%时伤害+30%' }
    },
    RANGER: {
        id: 'RANGER',
        name: '游侠',
        icon: '🏹',
        desc: '攻速极快，远程专精',
        color: 0x44FF44,
        stats: {
            maxHealth: 80,
            speed: 3.8,
            damageMultiplier: 0.8,
            attackSpeed: 1.4,
            critChance: 0.05,
            armor: 0,
            dodge: 0.05,
            lifeSteal: 0,
            hpRegen: 0,
            luck: 0,
            pickupRange: 50
        },
        startWeapon: 'SMG',
        passive: { type: 'range_bonus', bonus: 0.2, desc: '射程+20%' }
    },
    MAGE: {
        id: 'MAGE',
        name: '法师',
        icon: '🧙',
        desc: '元素伤害加成，较脆弱',
        color: 0xAA44FF,
        stats: {
            maxHealth: 70,
            speed: 3.3,
            damageMultiplier: 1.5,
            attackSpeed: 0.7,
            critChance: 0.1,
            armor: 0,
            dodge: 0,
            lifeSteal: 0,
            hpRegen: 0,
            luck: 0,
            pickupRange: 60
        },
        startWeapon: 'LIGHTNING',
        passive: { type: 'elemental_damage', bonus: 0.5, desc: '元素伤害+50%' }
    },
    THIEF: {
        id: 'THIEF',
        name: '盗贼',
        icon: '🗡️',
        desc: '高暴击高闪避，血量低',
        color: 0xFFFF44,
        stats: {
            maxHealth: 60,
            speed: 4.0,
            damageMultiplier: 0.9,
            attackSpeed: 1.2,
            critChance: 0.2,
            armor: 0,
            dodge: 0.15,
            lifeSteal: 0,
            hpRegen: 0,
            luck: 20,
            pickupRange: 70
        },
        startWeapon: 'PISTOL',
        passive: { type: 'crit_bonus', bonus: 0.3, desc: '暴击伤害+30%' }
    },
    ENGINEER: {
        id: 'ENGINEER',
        name: '工程师',
        icon: '🔧',
        desc: '攻速高，稳定输出',
        color: 0x44FFFF,
        stats: {
            maxHealth: 90,
            speed: 3.2,
            damageMultiplier: 0.7,
            attackSpeed: 1.5,
            critChance: 0,
            armor: 3,
            dodge: 0,
            lifeSteal: 0,
            hpRegen: 1,
            luck: 0,
            pickupRange: 50
        },
        startWeapon: 'LASER',
        passive: { type: 'fire_rate_bonus', bonus: 0.25, desc: '射速+25%' }
    },
    DOCTOR: {
        id: 'DOCTOR',
        name: '医生',
        icon: '💊',
        desc: '生命回复，生存能力强',
        color: 0xFF6B6B,
        stats: {
            maxHealth: 110,
            speed: 3.3,
            damageMultiplier: 0.85,
            attackSpeed: 1.0,
            critChance: 0,
            armor: 2,
            dodge: 0,
            lifeSteal: 3,
            hpRegen: 2,
            luck: 0,
            pickupRange: 50
        },
        startWeapon: 'PISTOL',
        passive: { type: 'heal_bonus', bonus: 0.5, desc: '治疗效果+50%' }
    },
    BERSERKER: {
        id: 'BERSERKER',
        name: '狂战士',
        icon: '🔥',
        desc: '低血量时极强，高风险高回报',
        color: 0xFF8800,
        stats: {
            maxHealth: 80,
            speed: 3.8,
            damageMultiplier: 1.1,
            attackSpeed: 1.3,
            critChance: 0.05,
            armor: 0,
            dodge: 0.1,
            lifeSteal: 0,
            hpRegen: 0,
            luck: 0,
            pickupRange: 40
        },
        startWeapon: 'SHOTGUN',
        passive: { type: 'low_hp_speed', threshold: 0.5, speedBonus: 0.5, damageBonus: 0.5, desc: '生命低于50%时移速+50%、伤害+50%' }
    }
};

// 角色系统管理
class CharacterSystem {
    constructor() {
        this.selectedCharacter = null;
        this.characters = CHARACTERS;
    }

    // 获取所有角色
    getAllCharacters() {
        return Object.values(this.characters);
    }

    // 选择角色
    selectCharacter(characterId) {
        if (this.characters[characterId]) {
            this.selectedCharacter = this.characters[characterId];
            return true;
        }
        return false;
    }

    // 获取当前选择的角色
    getSelected() {
        return this.selectedCharacter;
    }

    // 应用角色属性到玩家
    applyToPlayer(player) {
        if (!this.selectedCharacter) return;

        const charStats = this.selectedCharacter.stats;
        player.maxHealth = charStats.maxHealth;
        player.health = player.maxHealth;
        player.speed = charStats.speed;
        player.damageMultiplier = charStats.damageMultiplier;
        player.fireRateMultiplier = charStats.attackSpeed;
        player.critChance = charStats.critChance;
        player.armor = charStats.armor;
        player.dodge = charStats.dodge;
        player.lifeSteal = charStats.lifeSteal;
        player.hpRegen = charStats.hpRegen;
        player.luck = charStats.luck;
        player.pickupRange = charStats.pickupRange;
        player.characterId = this.selectedCharacter.id;
        player.characterName = this.selectedCharacter.name;
        player.characterIcon = this.selectedCharacter.icon;
        player.characterColor = this.selectedCharacter.color;
        player.passive = this.selectedCharacter.passive;

        // 应用被动技能
        if (this.selectedCharacter.passive) {
            this.applyPassive(player, this.selectedCharacter.passive);
        }

        // 绘制角色外观
        player.drawCharacter();
    }

    // 应用被动技能
    applyPassive(player, passive) {
        switch (passive.type) {
            case 'range_bonus':
                player.rangeBonus = passive.bonus;
                break;
            case 'fire_rate_bonus':
                player.fireRateMultiplier *= (1 + passive.bonus);
                break;
            case 'crit_bonus':
                player.critDamageBonus = passive.bonus;
                break;
            case 'heal_bonus':
                player.healBonus = passive.bonus;
                break;
            default:
                break;
        }
    }

    // 更新被动技能（每帧）
    updatePassive(player) {
        if (!player.passive) return;

        switch (player.passive.type) {
            case 'low_hp_damage':
                if (player.health / player.maxHealth < player.passive.threshold) {
                    player.currentDamageBonus = player.passive.bonus;
                } else {
                    player.currentDamageBonus = 0;
                }
                break;
            case 'low_hp_speed':
                if (player.health / player.maxHealth < player.passive.threshold) {
                    player.currentSpeedBonus = player.passive.speedBonus;
                    player.currentDamageBonus = player.passive.damageBonus;
                } else {
                    player.currentSpeedBonus = 0;
                    player.currentDamageBonus = 0;
                }
                break;
            default:
                break;
        }
    }
}
