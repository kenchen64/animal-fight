import Phaser from "phaser";
import MainScene from "./MainScene";

export default {
  type: Phaser.AUTO,
  parent: "game-container", 

  scale: {
    mode: Phaser.Scale.FIT,           
    autoCenter: Phaser.Scale.CENTER_BOTH, 
    width: 1920,                      
    height: 1080,
  },

  // 📌 核心新增：開啟 Phaser 的 DOM 容器功能，讓搖桿可以隨著遊戲畫面一起縮放
  dom: {
    createContainer: true
  },

  physics: {
    default: "arcade",
    arcade: { debug: false }
  },

  scene: [MainScene],
};
