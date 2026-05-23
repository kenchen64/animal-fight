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

    socket.on('skillEffect', data => {
      const target = this.players[data.target]

      if (!target) return

      const effect = this.add.sprite(
        target.sprite.x,
        target.sprite.y,
        'skill'
      );
      
      effect.setScale(2);
      effect.setDepth(999);
      
      this.tweens.add({
        targets: effect,
        alpha: 0,
        scaleX: 4,
        scaleY: 4,
        duration: 500,
        onComplete: () => {
          effect.destroy();
        }
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

  this.joyX = 0;
  this.joyY = 0;
  this.joystick =
    nipplejs.create({
    zone:
      document.getElementById(
        "game-container"
      ),
    mode: "static",
    position: {
      left: "80px",
      bottom: "80px",
    },
    size: 120,
    color: "white",
  });
  this.joystick.on(
    "move",
    (evt, data) => {
      if (!data.vector) return;
      this.joyX =
        data.vector.x;
      this.joyY =
        data.vector.y;
    }
  );
  this.joystick.on(
    "end",
    () => {
      this.joyX = 0;
      this.joyY = 0;
    }
  );
}

  update() {
    const me =
      this.players[socket.id];

    if (!me) return;

    const speed = 5;

let vx = 0;
let vy = 0;

if (this.keys.left.isDown)
  vx = -speed;

if (this.keys.right.isDown)
  vx = speed;

if (this.keys.up.isDown)
  vy = -speed;

if (this.keys.down.isDown)
  vy = speed;

vx += this.joyX * speed;
vy += this.joyY * speed;

me.sprite.x += vx;
me.sprite.y += vy;
    

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

  const now = Date.now();

  if (
    now - this.lastSkill > 1000
  ) {

    this.lastSkill = now;

    Object.keys(this.players)
      .forEach(id => {

      if (id !== socket.id) {

        socket.emit(
          "skill",
          id
        );

      }

    });
  }
  }
}
}
