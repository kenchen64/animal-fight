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
    // 1. 繪製背景（自動對齊置中）
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);

    this.players = {};
    this.lastSkill = 0; 

    const username = localStorage.getItem("username") || "Player";
    const animal = localStorage.getItem("animal") || "dog";

    // 2. 通知後端加入遊戲
    socket.emit("join", { username, animal });

    // 3. 監聽全體玩家狀態更新
    socket.on("players", (players) => {
      Object.keys(players).forEach((id) => {
        const player = players[id];

        // 排除已死亡的玩家
        if (player.dead) {
          if (this.players[id]) {
            this.players[id].sprite.setActive(false).setVisible(false);
            this.players[id].hpBar.setVisible(false);
            this.players[id].name.setVisible(false);
          }
          return;
        }

        // 建立新加入的玩家物件
        if (!this.players[id]) {
          const sprite = this.physics.add.sprite(player.x, player.y, player.animal);
          sprite.setScale(2);

          const hpBar = this.add.rectangle(player.x, player.y - 40, 60, 8, 0xff0000);
          const name = this.add.text(player.x, player.y - 70, player.username, {
            fontSize: "18px",
            color: "#ffffff",
          }).setOrigin(0.5);

          this.players[id] = { sprite, hpBar, name };
        }

        // 確保非死亡玩家為可見狀態
        this.players[id].sprite.setActive(true).setVisible(true);
        this.players[id].hpBar.setVisible(true);
        this.players[id].name.setVisible(true);

        // 同步位置與血條
        this.players[id].sprite.x = player.x;
        this.players[id].sprite.y = player.y;

        this.players[id].hpBar.x = player.x;
        this.players[id].hpBar.y = player.y - 40;
        this.players[id].hpBar.width = (player.hp / player.maxHp) * 60;

        this.players[id].name.x = player.x;
        this.players[id].name.y = player.y - 70;
      });
    });

    // 4. 監聽玩家死亡事件
    socket.on("dead", (id) => {
      if (this.players[id]) {
        this.players[id].sprite.setActive(false).setVisible(false);
        this.players[id].hpBar.setVisible(false);
        this.players[id].name.setVisible(false);
      }
    });

    // 5. 監聽大招特效
    socket.on('skillEffect', data => {
      const target = this.players[data.target];
      if (!target || !target.sprite.visible) return;

      const effect = this.add.sprite(target.sprite.x, target.sprite.y, 'skill');
      effect.setScale(2).setDepth(999);

      this.tweens.add({
        targets: effect,
        alpha: 0,
        scaleX: 4,
        scaleY: 4,
        duration: 500,
        onComplete: () => { effect.destroy(); }
      });
    });

    // 6. 綁定鍵盤控制
    this.keys = this.input.keyboard.addKeys({
      up: "W", down: "S", left: "A", right: "D", attack: "J", skill: "K",
    });

    // 7. 📌 修正：給 React 畫面一點渲染時間，延遲 300 毫秒再生成搖桿
    this.time.delayedCall(300, () => {
      this.createJoystick();
    });
  }

  createJoystick() {
    this.joyX = 0;
    this.joyY = 0;

    // 📌 修正：改為抓取我們剛剛在 index.html 建立的獨立搖桿容器
    let targetElement = document.getElementById("joystick-container");
    
    if (!targetElement) {
      console.warn("未偵測到 #joystick-container，搖桿改為綁定至 document.body");
      targetElement = document.body;
    }

    try {
      this.joystick = nipplejs.create({
        zone: targetElement, // 綁定到獨立的透明層
        mode: "static",
        position: { left: "100px", bottom: "100px" }, 
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
      
      console.log("NippleJS 搖桿成功綁定至獨立容器！");
    } catch (error) {
      console.error("NippleJS 初始化發生異常:", error);
    }
  }

  update() {
    const me = this.players[socket.id];
    if (!me || !me.sprite.visible) return; 

    const speed = 5; 
    let vx = 0;
    let vy = 0;

    // 鍵盤移動計算
    if (this.keys.left.isDown) vx = -speed;
    if (this.keys.right.isDown) vx = speed;
    if (this.keys.up.isDown) vy = -speed;
    if (this.keys.down.isDown) vy = speed;

    // 搖桿移動計算（鍵盤沒動時才採計搖桿）
    if (vx === 0 && vy === 0 && (this.joyX !== 0 || this.joyY !== 0)) {
      vx = this.joyX * speed;
      vy = this.joyY * speed * -1; 
    }

    // 發送座標至伺服器
    if (vx !== 0 || vy !== 0) {
      socket.emit("move", {
        x: me.sprite.x + vx,
        y: me.sprite.y + vy
      });
    }

    // 普通攻擊 (J)
    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      this.findAndAttack("attack");
    }

    // 技能攻擊 (K)
    if (Phaser.Input.Keyboard.JustDown(this.keys.skill)) {
      const now = Date.now();
      if (now - this.lastSkill > 1000) {
        this.lastSkill = now;
        this.findAndAttack("skill");
      }
    }
  }

  findAndAttack(type) {
    Object.keys(this.players).forEach((id) => {
      if (id !== socket.id && this.players[id].sprite.visible) {
        socket.emit(type, id);
      }
    });
handleShutdown() {
  // 移除所有在此場景中建立的 socket 監聽器
  socket.off("players");
  socket.off("dead");
  socket.off("skillEffect");

  // 銷毀 NippleJS 搖桿實例，釋放 DOM 節點
  if (this.joystick) {
    this.joystick.destroy();
  }
}

  }
}
