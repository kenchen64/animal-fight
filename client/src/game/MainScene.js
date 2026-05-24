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
    // 1. 繪製背景
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);

    this.players = {};
    this.lastSkill = 0; 

    const username = localStorage.getItem("username") || "Player";
    const animal = localStorage.getItem("animal") || "dog";

    // 2. 通知後端加入遊戲
    socket.emit("join", { username, animal });

    // 3. 監聽全體玩家狀態更新
    socket.on("players", (serverPlayers) => {
      // 📌 修正：處理斷線清除（如果後端資料沒有這個 ID，就將前端物件銷毀）
      Object.keys(this.players).forEach((id) => {
        if (!serverPlayers[id]) {
          this.removePlayer(id);
        }
      });

      Object.keys(serverPlayers).forEach((id) => {
        const player = serverPlayers[id];

        // 排除已死亡的玩家
        if (player.dead) {
          if (this.players[id]) {
            this.players[id].sprite.setActive(false).setVisible(false);
            this.players[id].hpBarBg.setVisible(false);
            this.players[id].hpBar.setVisible(false);
            this.players[id].name.setVisible(false);
          }
          return;
        }

        // 建立新加入的玩家物件
        if (!this.players[id]) {
          const sprite = this.physics.add.sprite(player.x, player.y, player.animal);
          sprite.setScale(2);

          // 📌 修正：血條改為向左對齊（Origin 設為 0, 0.5），並新增黑色背景底條
          const hpBarBg = this.add.rectangle(player.x - 30, player.y - 40, 60, 8, 0x000000).setOrigin(0, 0.5);
          const hpBar = this.add.rectangle(player.x - 30, player.y - 40, 60, 8, 0xff0000).setOrigin(0, 0.5);
          
          const name = this.add.text(player.x, player.y - 70, player.username, {
            fontSize: "18px",
            color: "#ffffff",
          }).setOrigin(0.5);

          this.players[id] = { sprite, hpBarBg, hpBar, name };
        }

        // 確保非死亡玩家為可見狀態
        this.players[id].sprite.setActive(true).setVisible(true);
        this.players[id].hpBarBg.setVisible(true);
        this.players[id].hpBar.setVisible(true);
        this.players[id].name.setVisible(true);

        // 同步位置與血條
        this.players[id].sprite.x = player.x;
        this.players[id].sprite.y = player.y;

        // 📌 修正：血條跟隨玩家時，要把寬度起點向左偏移 30 像素（寬度的一半）
        this.players[id].hpBarBg.x = player.x - 30;
        this.players[id].hpBarBg.y = player.y - 40;

        this.players[id].hpBar.x = player.x - 30;
        this.players[id].hpBar.y = player.y - 40;
        
        // 📌 修正：使用 setSize 修改寬度，這樣就會往左邊扣血，而不是往中間縮
        const currentHpWidth = Math.max(0, (player.hp / player.maxHp) * 60);
        this.players[id].hpBar.setSize(currentHpWidth, 8);

        this.players[id].name.x = player.x;
        this.players[id].name.y = player.y - 70;
      });
    });

    // 4. 監聽玩家死亡事件
    socket.on("dead", (id) => {
      if (this.players[id]) {
        this.players[id].sprite.setActive(false).setVisible(false);
        this.players[id].hpBarBg.setVisible(false);
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

    // 7. 延遲生成搖桿
    this.time.delayedCall(300, () => {
      this.createJoystick();
    });

    // 📌 修正：監聽場景關閉事件，防止記憶體洩漏
    this.events.on('shutdown', this.handleShutdown, this);
  }

  createJoystick() {
    this.joyX = 0;
    this.joyY = 0;

    let targetElement = document.getElementById("joystick-container");
    if (!targetElement) {
      console.warn("未偵測到 #joystick-container，搖桿改為綁定至 document.body");
      targetElement = document.body;
    }

    try {
      this.joystick = nipplejs.create({
        zone: targetElement,
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

    if (this.keys.left.isDown) vx = -speed;
    if (this.keys.right.isDown) vx = speed;
    if (this.keys.up.isDown) vy = -speed;
    if (this.keys.down.isDown) vy = speed;

    if (vx === 0 && vy === 0 && (this.joyX !== 0 || this.joyY !== 0)) {
      vx = this.joyX * speed;
      vy = this.joyY * speed * -1; 
    }

    if (vx !== 0 || vy !== 0) {
      socket.emit("move", {
        x: me.sprite.x + vx,
        y: me.sprite.y + vy
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      this.findAndAttack("attack");
    }

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
  }

  // 📌 新增：徹底移除玩家與其畫面上所有元件的方法
  removePlayer(id) {
    if (this.players[id]) {
      this.players[id].sprite.destroy();
      this.players[id].hpBarBg.destroy();
      this.players[id].hpBar.destroy();
      this.players[id].name.destroy();
      delete this.players[id];
      console.log(`玩家 ${id} 已離開，成功清除相關物件。`);
    }
  }

  // 📌 新增：場景關閉時註銷所有監聽器
  handleShutdown() {
    socket.off("players");
    socket.off("dead");
    socket.off("skillEffect");

    if (this.joystick) {
      this.joystick.destroy();
    }
    console.log("MainScene 資源已成功卸載。");
  }
}
