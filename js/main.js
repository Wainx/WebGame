// 游戏入口文件
// 等待DOM加载完成
window.addEventListener("DOMContentLoaded", () => {
  console.log("🥔 土豆兄弟 - 游戏初始化中...");

  // 创建游戏实例
  const game = new Game();

  // 暴露到全局（调试用）
  window.game = game;

  // CSS fits the whole game and HUD to the same 16:9 frame.

  console.log("🥔 土豆兄弟 - 游戏初始化完成!");
  console.log("操作说明:");
  console.log("- WASD / 方向键: 移动");
  console.log("- 自动瞄准射击");
  console.log("- ESC / P: 暂停");
});

// 错误处理
window.addEventListener("error", (event) => {
  console.error("游戏错误:", event.error);
});

// 防止页面意外关闭
window.addEventListener("beforeunload", (event) => {
  if (window.game && window.game.getState() === GAME_STATE.PLAYING) {
    event.preventDefault();
    event.returnValue = "游戏正在进行中，确定要离开吗？";
  }
});
