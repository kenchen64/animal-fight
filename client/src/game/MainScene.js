import Phaser from "phaser";
import socket from "../socket";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
  }

  preload() {
    this.load.image(
      "dog",
      "src/game/dog.png"
    );

    this.load.image(
      "cat",
      "src/game/cat.png"
    );

    this.load.image(
      "fox",
      "src/game/fox.png"
    );
  }

  create() {
    this.players = {};

    const name = prompt("輸入名字");
    const animal = prompt("dog / cat / fox");

    socket.emit("joinGame", {
      name,
      animal,
    });

    socket.on("players", (players) => {
      Object.keys(players).forEach((id) => {
        const player = players[id];

        if (!this.players[id]) {
          this.players[id] = this.add.sprite(
            player.x,
            player.y,
            player.animal
          );

          this.players[id].setScale(2);

          const text = this.add.text(
            player.x - 20,
            player.y - 50,
            player.name
          );

          this.players[id].nameText = text;
        }

        this.players[id].x = player.x;
        this.players[id].y = player.y;

        this.players[id].nameText.setPosition(
          player.x - 20,
          player.y - 50
        );
      });
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.attackKey =
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.J
      );
  }

  update() {
    const myId = socket.id;

    if (!this.players[myId]) return;

    let speed = 5;

    if (this.cursors.left.isDown) {
      this.players[myId].x -= speed;
    }

    if (this.cursors.right.isDown) {
      this.players[myId].x += speed;
    }

    if (this.cursors.up.isDown) {
      this.players[myId].y -= speed;
    }

    if (this.cursors.down.isDown) {
      this.players[myId].y += speed;
    }

    socket.emit("move", {
      x: this.players[myId].x,
      y: this.players[myId].y,
    });

    if (
      Phaser.Input.Keyboard.JustDown(
        this.attackKey
      )
    ) {
      Object.keys(this.players).forEach((id) => {
        if (id !== myId) {
          socket.emit("attack", id);
        }
      });
    }
  }
}
