// 输入管理系统
class InputManager {
  constructor() {
    this.keys = {};
    this.pressedKeys = new Set();
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      left: false,
      right: false,
    };
    this.gamepad = null;
    this.setupListeners();
  }

  setupListeners() {
    // 键盘事件
    window.addEventListener("keydown", (e) => {
      if (!this.keys[e.code] && !e.repeat) this.pressedKeys.add(e.code);
      this.keys[e.code] = true;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Escape",
          "KeyP",
          "Space",
        ].includes(e.code) &&
        !["INPUT", "BUTTON", "TEXTAREA"].includes(e.target.tagName)
      )
        e.preventDefault();
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // 鼠标事件
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });

    // 禁用右键菜单
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    window.addEventListener("blur", () => this.reset());

    // 手柄支持
    window.addEventListener("gamepadconnected", (e) => {
      this.gamepad = e.gamepad;
      console.log("手柄已连接:", e.gamepad.id);
    });
  }

  // 获取移动方向
  getMovement() {
    let x = 0;
    let y = 0;

    // WASD
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) y -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) y += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) x += 1;

    // 手柄左摇杆
    if (this.gamepad) {
      const gp = navigator.getGamepads()[this.gamepad.index];
      if (gp) {
        const deadzone = 0.2;
        if (Math.abs(gp.axes[0]) > deadzone) x += gp.axes[0];
        if (Math.abs(gp.axes[1]) > deadzone) y += gp.axes[1];
      }
    }

    // 归一化
    const length = Math.sqrt(x * x + y * y);
    if (length > 0) {
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  // 检查按键是否按下
  isKeyDown(code) {
    return this.keys[code] === true;
  }

  // 检查按键是否刚按下
  isKeyPressed(code) {
    return this.pressedKeys.has(code);
  }

  // 更新（每帧调用）
  update() {
    this.pressedKeys.clear();
  }

  // 获取鼠标在世界坐标的位置
  getWorldMouse(camera) {
    return {
      x: this.mouse.x + camera.x - CONFIG.CANVAS_WIDTH / 2,
      y: this.mouse.y + camera.y - CONFIG.CANVAS_HEIGHT / 2,
    };
  }

  // 检查暂停键
  isPausePressed() {
    return this.isKeyPressed("Escape") || this.isKeyPressed("KeyP");
  }

  // 重置输入状态
  reset() {
    this.keys = {};
    this.pressedKeys.clear();
    this.mouse.left = false;
    this.mouse.right = false;
  }
}
