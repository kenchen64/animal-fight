import { useEffect } from "react";
import Phaser from "phaser";

import config from "./game/config";

function App() {
  useEffect(() => {
    new Phaser.Game(config);
  }, []);

  return <div id="game"></div>;
}

export default App;