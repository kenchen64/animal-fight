import Phaser from "phaser";

import MainScene from "./MainScene";

export default {
  type: Phaser.AUTO,

  parent: "game-container",

  width: window.innerWidth,

  height: window.innerHeight,

  physics: {
    default: "arcade",
  },

  scene: [MainScene],
};
