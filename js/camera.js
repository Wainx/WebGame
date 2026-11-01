// 摄像机系统
class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothness = 0.1;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
  }

  // 跟踪目标
  follow(target) {
    this.targetX = target.x;
    this.targetY = target.y;
  }

  // 更新摄像机位置
  update(delta) {
    // 平滑跟随
    this.x = MathUtils.lerp(
      this.x,
      this.targetX,
      1 - Math.pow(1 - this.smoothness, delta),
    );
    this.y = MathUtils.lerp(this.y, this.targetY, this.smoothness);

    // 限制在世界边界
    const halfWidth = CONFIG.CANVAS_WIDTH / 2;
    const halfHeight = CONFIG.CANVAS_HEIGHT / 2;
    this.x = MathUtils.clamp(this.x, halfWidth, CONFIG.WORLD_WIDTH - halfWidth);
    this.y = MathUtils.clamp(
      this.y,
      halfHeight,
      CONFIG.WORLD_HEIGHT - halfHeight,
    );

    // 屏幕震动
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta * 16.67;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const intensity = this.shakeIntensity * progress;
      this.shakeX = (Math.random() - 0.5) * 2 * intensity;
      this.shakeY = (Math.random() - 0.5) * 2 * intensity;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  // 触发屏幕震动
  shake(intensity = 10, duration = 200) {
    if (this.reduceMotion) return;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  // 应用摄像机变换到容器
  applyTo(container) {
    container.x = -this.x + CONFIG.CANVAS_WIDTH / 2 + this.shakeX;
    container.y = -this.y + CONFIG.CANVAS_HEIGHT / 2 + this.shakeY;
  }

  // 世界坐标转屏幕坐标
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x + CONFIG.CANVAS_WIDTH / 2 + this.shakeX,
      y: worldY - this.y + CONFIG.CANVAS_HEIGHT / 2 + this.shakeY,
    };
  }

  // 屏幕坐标转世界坐标
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x - CONFIG.CANVAS_WIDTH / 2 - this.shakeX,
      y: screenY + this.y - CONFIG.CANVAS_HEIGHT / 2 - this.shakeY,
    };
  }

  // 检查对象是否在视野内
  isVisible(x, y, margin = 50) {
    const screenPos = this.worldToScreen(x, y);
    return (
      screenPos.x > -margin &&
      screenPos.x < CONFIG.CANVAS_WIDTH + margin &&
      screenPos.y > -margin &&
      screenPos.y < CONFIG.CANVAS_HEIGHT + margin
    );
  }

  // 重置摄像机
  reset() {
    this.x = CONFIG.WORLD_WIDTH / 2;
    this.y = CONFIG.WORLD_HEIGHT / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
  }
}
