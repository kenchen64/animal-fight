import { useEffect } from "react";

import Phaser from "phaser";

import config from "../game/config";

export default function Game() {
  useEffect(() => {
    const game =
      new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game"></div>;
}