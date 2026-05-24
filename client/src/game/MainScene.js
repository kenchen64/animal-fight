import Phaser from "phaser";
import socket from "../socket";
import nipplejs from "nipplejs";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("main");
  }

  preload() {
    this.load.image("bg", "/assets/background.png");
    this.load.image("dog", "/assets/dog.png");
    this.load.image("cat", "/assets/cat.png");
    this.load.image("fox", "/assets/fox.png");
    this.load.image("skill", "/assets/skill.png");
  }

  create() {
    this.add.image(960, 540, "bg");

    this.players = {};
    this.lastSkill = 0; // 【修正3】初始化技能冷卻時間，防止 NaN 錯誤

    const username = localStorage.getItem("username");
    const animal = localStorage.getItem("animal");

    socket.emit("join", { username, animal });

    socket.on("players", (players) => {
      Object.keys(players).forEach((id) => {
        const player = players[id];

        if (!this.players[id]) {
          const sprite = this.physics.add.sprite(player.x, player.y, player.animal);
          sprite.setScale(2);

          const hpBar = this.add.rectangle(player.x, player.y - 40, 60, 8, 0xff0000);
          const name = this.add.text(player.x - 20, player.y - 70, player.username, {
            fontSize: "18px",
            color: "#ffffff",
          });

          this.players[id] = { sprite, hpBar, name };
        }

        // 當收到伺服器廣播時，統一更新所有元件的座標（包含血條與名字）
        this.players[id].sprite.x = player.x;
        this.players[id].sprite.y = player.y;

        this.players[id].hpBar.x = player.x;
        this.players[id].hpBar.y = player.y - 40;
        this.players[id].hpBar.width = (player.hp / player.maxHp) * 60;

        this.players[id].name.x = player.x - 20;
        this.players[id].name.y = player.y - 70;
      });
    });

    socket.on('skillEffect', data => {
      const target = this.players[data.target];
      if (!target) return;

      const effect = this.add.sprite(target.sprite.x, target.sprite.y, 'skill');
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

    this.keys = this.input.keyboard.addKeys({
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
    this.joystick = nipplejs.create({
      zone: document.getElementById("game-container"),
      mode: "static",
      position: { left: "80px", bottom: "80px" },
      size: 120,
      color: "white",
    });

    this.joystick.on("move", (evt, data) => {
      if (!data.vector) return;
      this.joyX = data.vector.x;
      this.joyY = data.vector.y;
    });

    this.joystick.on("end", () => {
      this.joyX = 0;
      this.joyY = 0;
    });
  }

  update() {
    const me = this.players[socket.id];
    if (!me) return;

    const speed = 5;
    let vx = 0;
    let vy = 0;

    // 1. 鍵盤輸入
    if (this.keys.left.isDown) vx = -speed;
    if (this.keys.right.isDown) vx = speed;
    if (this.keys.up.isDown) vy = -speed;
    if (this.keys.down.isDown) vy = speed;

    // 2. 搖桿輸入【修正2】：nipplejs 的 Y 軸與 Phaser 相反，需乘上 -1
    if (this.joyX !== 0 || this.joyY !== 0) {
      vx = this.joyX * speed;
      vy = this.joyY * speed * -1; 
    }

    // 3. 【修正1】若有移動速度，將增量發送給後端，不由前端直接加座標
    if (vx !== 0 || vy !== 0) {
      socket.emit("move", {
        x: me.sprite.x + vx,
        y: me.sprite.y + vy
      });
    }

    // 4. 普通攻擊 (J)
    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      Object.keys(this.players).forEach((id) => {
        if (id !== socket.id) {
          socket.emit("attack", id);
        }
      });
    }

    // 5. 技能攻擊 (K)
    if (Phaser.Input.Keyboard.JustDown(this.keys.skill)) {
      const now = Date.now();
      if (now - this.lastSkill > 1000) {
        this.lastSkill = now;
        Object.keys(this.players).forEach(id => {
          if (id !== socket.id) {
            socket.emit("skill", id);
          }
        });
      }
    }
  }
}
