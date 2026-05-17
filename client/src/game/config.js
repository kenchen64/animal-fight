import Phaser from "phaser";
import MainScene from "./MainScene";

export default {
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  backgroundColor: "#222",
  physics: {
    default: "arcade",
  },
  scene: [MainScene],
};