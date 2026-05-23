import Phaser from "phaser";
import socket from "../socket";

import nipplejs from "nipplejs";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
  }

  preload() {
    this.load.image(
      "bg",
      "/assets/background.png"
    );

    this.load.image(
      "dog",
      "/assets/dog.png"
    );

    this.load.image(
      "cat",
      "/assets/cat.png"
    );

    this.load.image(
      "fox",
      "/assets/fox.png"
    );

    this.load.image(
      "skill",
      "/assets/skill.png"
    );
  }

  create() {
    this.add.image(
      960,
      540,
      "bg"
    );

    this.players = {};

    const username =
      localStorage.getItem("username");

    const animal =
      localStorage.getItem("animal");

    socket.emit("join", {
      username,
      animal,
    });

    socket.on("players", (players) => {
      Object.keys(players).forEach((id) => {
        const player = players[id];

        if (!this.players[id]) {
          const sprite =
            this.physics.add.sprite(
              player.x,
              player.y,
              player.animal
            );

          sprite.setScale(2);

          const hpBar =
            this.add.rectangle(
              player.x,
              player.y - 40,
              60,
              8,
              0xff0000
            );

          const name =
            this.add.text(
              player.x - 20,
              player.y - 70,
              player.username,
              {
                fontSize: "18px",
                color: "#ffffff",
              }
            );

          this.players[id] = {
            sprite,
            hpBar,
            name,
          };
        }

        this.players[id].sprite.x =
          player.x;

        this.players[id].sprite.y =
          player.y;

        this.players[id].hpBar.x =
          player.x;

        this.players[id].hpBar.y =
          player.y - 40;

        this.players[id].hpBar.width =
          (player.hp /
            player.maxHp) *
          60;

        this.players[id].name.x =
          player.x - 20;

        this.players[id].name.y =
          player.y - 70;
      });
    });

    this.keys =
      this.input.keyboard.addKeys({
        up: "W",
        down: "S",
        left: "A",
        right: "D",
        attack: "J",
        skill: "K",
      });

    this.createJoystick();
  }

  createJoystick() {
    this.joystick =
      nipplejs.create({
        zone: document.body,
        mode: "static",

        position: {
          left: "100px",
          bottom: "100px",
        },

        color: "white",
      });

    this.joyX = 0;
    this.joyY = 0;

    this.joystick.on(
      "move",
      (evt, data) => {
        this.joyX = data.vector.x;
        this.joyY = data.vector.y;
      }
    );

    this.joystick.on("end", () => {
      this.joyX = 0;
      this.joyY = 0;
    });
  }

  update() {
    const me =
      this.players[socket.id];

    if (!me) return;

    let speed = 5;

    if (this.keys.left.isDown)
      me.sprite.x -= speed;

    if (this.keys.right.isDown)
      me.sprite.x += speed;

    if (this.keys.up.isDown)
      me.sprite.y -= speed;

    if (this.keys.down.isDown)
      me.sprite.y += speed;

    me.sprite.x +=
      this.joyX * speed;

    me.sprite.y +=
      this.joyY * speed;

    socket.emit("move", {
      x: me.sprite.x,
      y: me.sprite.y,
    });

    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.attack
      )
    ) {
      Object.keys(this.players).forEach(
        (id) => {
          if (id !== socket.id) {
            socket.emit(
              "attack",
              id
            );
          }
        }
      );
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.skill
      )
    ) {
      Object.keys(this.players).forEach(
        (id) => {
          if (id !== socket.id) {
            socket.emit(
              "skill",
              id
            );
          }
        }
      );
    }
  }
}
