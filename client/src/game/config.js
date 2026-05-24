import Phaser from "phaser";

import MainScene from "./MainScene";

export default {
  type: Phaser.AUTO,

  scale: {
  mode: Phaser.Scale.Fit,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: window.innerWidth,
  height: window.innerHeight,
  },
  physics: {
    default: "arcade",
  },

  scene: [MainScene],
};
