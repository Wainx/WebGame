// 菜单系统
class MenuSystem {
  constructor(game) {
    this.game = game;
    this.characterSystem = new CharacterSystem();
    this.selectedCharId = null;
    this.setupEventListeners();
  }

  // 设置事件监听
  setupEventListeners() {
    // 主菜单 - 选择角色按钮
    document.getElementById("btn-start").addEventListener("click", () => {
      this.showCharacterSelect();
    });

    // 画面效果设置
    document.getElementById("btn-settings").addEventListener("click", () => {
      document.getElementById("settings-screen").classList.remove("hidden");
    });

    document
      .getElementById("btn-close-settings")
      .addEventListener("click", () =>
        document.getElementById("settings-screen").classList.add("hidden"),
      );
    document.getElementById("reduce-motion").addEventListener("change", (e) => {
      this.game.player.reduceMotion = e.target.checked;
      this.game.camera.reduceMotion = e.target.checked;
      this.game.camera.shakeTimer = 0;
    });

    // 暂停界面按钮
    document.getElementById("btn-resume").addEventListener("click", () => {
      this.game.resumeGame();
    });

    document.getElementById("btn-quit").addEventListener("click", () => {
      this.game.quitToMenu();
    });

    // 游戏结束界面按钮
    document.getElementById("btn-retry").addEventListener("click", () => {
      this.showCharacterSelect();
    });

    document.getElementById("btn-menu").addEventListener("click", () => {
      this.game.quitToMenu();
    });

    // 商店继续按钮
    document.getElementById("btn-continue").addEventListener("click", () => {
      this.game.closeShop();
    });

    // HUD暂停按钮
    document.getElementById("btn-pause").addEventListener("click", () => {
      if (
        this.game.state === GAME_STATE.PLAYING ||
        this.game.state === GAME_STATE.SHOP
      ) {
        this.game.pauseGame();
      }
    });

    // 角色选择 - 确认按钮
    document
      .getElementById("btn-confirm-char")
      .addEventListener("click", () => {
        if (this.selectedCharId) {
          this.characterSystem.selectCharacter(this.selectedCharId);
          this.game.startGame();
        }
      });

    // 角色选择 - 返回按钮
    document.getElementById("btn-back-menu").addEventListener("click", () => {
      this.hideCharacterSelect();
      this.showMainMenu();
    });
  }

  // 显示主菜单
  showMainMenu() {
    this.hideAll();
    document.getElementById("main-menu").classList.remove("hidden");
  }

  // 隐藏主菜单
  hideMainMenu() {
    document.getElementById("main-menu").classList.add("hidden");
  }

  // 显示角色选择界面
  showCharacterSelect() {
    this.hideAll();
    this.selectedCharId = null;
    document.getElementById("btn-confirm-char").disabled = true;
    document.getElementById("char-detail").innerHTML =
      '<p class="char-detail-hint">← 选择一个角色</p>';
    this.renderCharacterGrid();
    document.getElementById("character-select").classList.remove("hidden");
  }

  // 隐藏角色选择界面
  hideCharacterSelect() {
    document.getElementById("character-select").classList.add("hidden");
  }

  // 渲染角色网格
  renderCharacterGrid() {
    const grid = document.getElementById("char-grid");
    grid.innerHTML = "";

    const characters = this.characterSystem.getAllCharacters();
    for (const char of characters) {
      const card = document.createElement("button");
      card.type = "button";
      card.setAttribute("aria-label", char.name);
      card.setAttribute("aria-pressed", "false");
      card.className = "char-card";
      card.dataset.charId = char.id;

      card.innerHTML = `
                <img class="char-portrait" src="${this.getPortrait(char.id)}" alt="" width="128" height="144">
                <div class="char-name">${char.name}</div>
                <div class="char-desc-short">${char.desc}</div>
            `;

      card.addEventListener("click", () => {
        this.selectCharacterCard(char.id);
      });

      grid.appendChild(card);
    }
  }

  getPortrait(id) {
    this.portraits ||= {};
    return (this.portraits[id] ||= PotatoArt.portrait(
      this.game.app.renderer,
      id,
    ));
  }

  // 选择角色卡片
  selectCharacterCard(charId) {
    this.selectedCharId = charId;

    // 更新选中状态
    const cards = document.querySelectorAll(".char-card");
    cards.forEach((card) => {
      card.classList.toggle("selected", card.dataset.charId === charId);
      card.setAttribute("aria-pressed", String(card.dataset.charId === charId));
    });

    // 启用确认按钮
    document.getElementById("btn-confirm-char").disabled = false;

    // 显示角色详情
    this.showCharacterDetail(charId);
  }

  // 显示角色详情
  showCharacterDetail(charId) {
    const char = this.characterSystem.characters[charId];
    if (!char) return;

    const detail = document.getElementById("char-detail");
    const stats = char.stats;

    // 构建属性对比显示（与默认值对比）
    const defaultStats = CHARACTERS.WELL_ROUNDED.stats;
    const statItems = [
      {
        label: "生命值",
        value: stats.maxHealth,
        default: defaultStats.maxHealth,
        suffix: "",
      },
      {
        label: "移速",
        value: stats.speed,
        default: defaultStats.speed,
        suffix: "",
      },
      {
        label: "伤害",
        value: stats.damageMultiplier,
        default: defaultStats.damageMultiplier,
        suffix: "x",
        isPercent: true,
      },
      {
        label: "攻速",
        value: stats.attackSpeed,
        default: defaultStats.attackSpeed,
        suffix: "x",
        isPercent: true,
      },
      {
        label: "暴击率",
        value: stats.critChance,
        default: defaultStats.critChance,
        suffix: "%",
        isPercent: true,
      },
      {
        label: "护甲",
        value: stats.armor,
        default: defaultStats.armor,
        suffix: "",
      },
      {
        label: "闪避",
        value: stats.dodge,
        default: defaultStats.dodge,
        suffix: "%",
        isPercent: true,
      },
      {
        label: "生命回复",
        value: stats.hpRegen,
        default: defaultStats.hpRegen,
        suffix: "/秒",
      },
      {
        label: "生命偷取",
        value: stats.lifeSteal,
        default: defaultStats.lifeSteal,
        suffix: "/击杀",
      },
      {
        label: "运气",
        value: stats.luck,
        default: defaultStats.luck,
        suffix: "",
      },
    ];

    let statsHtml = "";
    for (const stat of statItems) {
      let displayValue = stat.value;
      let valueClass = "";

      if (stat.isPercent && stat.suffix === "%") {
        displayValue = Math.round(stat.value * 100);
      } else if (stat.isPercent && stat.suffix === "x") {
        displayValue = stat.value.toFixed(1);
        if (stat.value > stat.default) valueClass = "bonus";
        else if (stat.value < stat.default) valueClass = "penalty";
      } else {
        if (stat.value > stat.default) valueClass = "bonus";
        else if (stat.value < stat.default) valueClass = "penalty";
      }

      statsHtml += `
                <div class="char-stat">
                    <span class="char-stat-label">${stat.label}</span>
                    <span class="char-stat-value ${valueClass}">${displayValue}${stat.suffix}</span>
                </div>
            `;
    }

    const weaponConfig = CONFIG.WEAPONS[char.startWeapon];
    const weaponName = weaponConfig ? weaponConfig.name : "无";

    let passiveHtml = "";
    if (char.passive) {
      passiveHtml = `<div class="char-passive-info">✨ ${char.passive.desc}</div>`;
    }

    detail.innerHTML = `
            <div class="char-detail-content">
                <div class="char-detail-left">
                    <div class="char-icon">${char.icon}</div>
                    <div class="char-name">${char.name}</div>
                </div>
                <div class="char-detail-right">
                    <h3>属性</h3>
                    <div class="char-stats-grid">${statsHtml}</div>
                    <div class="char-weapon-info">🔫 初始武器: ${weaponName}</div>
                    ${passiveHtml}
                </div>
            </div>
        `;
  }

  // 显示暂停界面（含属性）
  showPauseMenu() {
    this.updatePauseStats();
    document.getElementById("pause-screen").classList.remove("hidden");
  }

  // 更新暂停界面属性
  updatePauseStats() {
    const player = this.game.player;

    // 角色信息
    document.getElementById("pause-char-icon").textContent =
      player.characterIcon || "🥔";
    document.getElementById("pause-char-name").textContent =
      player.characterName || "全能者";

    // 属性网格
    const grid = document.getElementById("pause-stats-grid");
    const stats = [
      {
        label: "生命",
        value: `${Math.floor(player.health)}/${player.maxHealth}`,
      },
      { label: "移速", value: player.speed.toFixed(1) },
      { label: "伤害", value: `${Math.round(player.damageMultiplier * 100)}%` },
      {
        label: "攻速",
        value: `${Math.round(player.fireRateMultiplier * 100)}%`,
      },
      { label: "暴击率", value: `${Math.round(player.critChance * 100)}%` },
      { label: "护甲", value: player.armor },
      { label: "闪避", value: `${Math.round(player.dodge * 100)}%` },
      { label: "生命偷取", value: `${player.lifeSteal}/击杀` },
      { label: "生命回复", value: `${player.hpRegen || 0}/秒` },
      { label: "运气", value: player.luck },
      { label: "拾取范围", value: player.pickupRange },
      { label: "等级", value: `Lv.${player.level}` },
    ];

    grid.innerHTML = stats
      .map(
        (s) => `
            <div class="stat-row">
                <span class="stat-label">${s.label}</span>
                <span class="stat-value">${s.value}</span>
            </div>
        `,
      )
      .join("");

    // 被动技能
    if (player.passive) {
      grid.innerHTML += `
                <div class="stat-row" style="grid-column: span 2; margin-top: 5px; background: rgba(255,215,0,0.1);">
                    <span class="stat-label" style="color: #ffd700;">✨ 被动</span>
                    <span class="stat-value" style="color: #ffd700; font-size: 0.8rem;">${player.passive.desc}</span>
                </div>
            `;
    }

    // 武器列表
    const weaponsList = document.getElementById("pause-weapons-list");
    const weapons = player.weapons;
    if (weapons.length > 0) {
      weaponsList.innerHTML = weapons
        .map(
          (w, i) => `
                <div class="weapon-entry" ${i === player.currentWeaponIndex ? 'style="border: 1px solid #ffd700;"' : ""}>
                    <span class="weapon-icon">${w.icon || "🔫"}</span>
                    <span class="weapon-name">${w.name}</span>
                    <span class="weapon-level">Lv.${w.level}</span>
                </div>
            `,
        )
        .join("");
    } else {
      weaponsList.innerHTML =
        '<div style="color: #666; text-align: center;">无武器</div>';
    }
  }

  // 隐藏暂停界面
  hidePauseMenu() {
    document.getElementById("pause-screen").classList.add("hidden");
  }

  // 显示游戏结束界面
  showGameOver(stats) {
    document.getElementById("final-wave").textContent = stats.wave;
    document.getElementById("final-kills").textContent = stats.kills;
    document.getElementById("final-time").textContent = Math.floor(
      stats.timePlayed / 1000,
    );
    document.getElementById("gameover-screen").classList.remove("hidden");
  }

  // 隐藏游戏结束界面
  hideGameOver() {
    document.getElementById("gameover-screen").classList.add("hidden");
  }

  // 隐藏所有界面
  hideAll() {
    const screens = document.querySelectorAll(".ui-screen");
    screens.forEach((screen) => screen.classList.add("hidden"));
  }
}
