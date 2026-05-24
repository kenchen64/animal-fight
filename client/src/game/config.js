import Phaser from "phaser";
import MainScene from "./MainScene";

export default {
  type: Phaser.AUTO,
  
  // 📌 確保遊戲掛載到您的 index.html 裡面設定的 div
  parent: "game-container", 

  scale: {
    mode: Phaser.Scale.FIT,           // 自動等比例縮放
    autoCenter: Phaser.Scale.CENTER_BOTH, // 畫面永遠置中（黑邊會均勻分配在兩側）
    
    // 📌 核心修正：改成固定的虛擬解析度，不要用 window.innerWidth
    width: 1920,                      
    height: 1080,
  },
  
  physics: {
    default: "arcade",
    arcade: {
      debug: false // 想要看碰撞框可以改成 true
    }
  },

  scene: [MainScene],
};
