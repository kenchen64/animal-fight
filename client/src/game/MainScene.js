import Phaser from "phaser";
import socket from "../socket";
import nipplejs from "nipplejs";

// 【建議】請確保您的 Phaser Config 包含以下縮放設定：
// const config = {
//   type: Phaser.AUTO,
//   scale: {
//     mode: Phaser.Scale.FIT,          // 自動縮放以適應螢幕
//     autoCenter: Phaser.Scale.CENTER_BOTH, // 畫面居中
//     width: 1920,                     // 基礎開發寬度
//     height: 1080                     // 基礎開發高度
//   },
//   physics: { default: 'arcade' }
// };

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
    // 改用當前畫面的中心點繪製背景，防止自動縮放時跑位
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);

    this.players = {};
    this.lastSkill = 0; 

    const username = localStorage.getItem("username") || "Player";
    const animal = localStorage.getItem("animal") || "dog";

    socket.emit("join", { username, animal });

    socket.on("players", (players) => {
      Object.keys(players).forEach((id) => {
        const player = players[id];

        // 排除已死亡或不存在的玩家
        if (player.dead) {
          if (this.players[id]) {
            this.players[id].sprite.setActive(false).setVisible(false);
            this.players[id].hpBar.setVisible(false);
            this.players[id].name.setVisible(false);
          }
          return;
        }

        if (!this.players[id]) {
          const sprite = this.physics.add.sprite(player.x, player.y, player.animal);
          sprite.setScale(2);

          const hpBar = this.add.rectangle(player.x, player.y - 40, 60, 8, 0xff0000);
          const name = this.add.text(player.x, player.y - 70, player.username, {
            fontSize: "18px",
            color: "#ffffff",
          }).setOrigin(0.5); // 設為中心對齊

          this.players[id] = { sprite, hpBar, name };
        }

        // 確保重生或移動時可見
        this.players[id].sprite.setActive(true).setVisible(true);
        this.players[id].hpBar.setVisible(true);
        this.players[id].name.setVisible(true);

        // 平滑同步位置 (也可以直接賦值，但伺服器有更新即可)
        this.players[id].sprite.x = player.x;
        this.players[id].sprite.y = player.y;

        this.players[id].hpBar.x = player.x;
        this.players[id].hpBar.y = player.y - 40;
        this.players[id].hpBar.width = (player.hp / player.maxHp) * 60;

        this.players[id].name.x = player.x;
        this.players[id].name.y = player.y - 70;
      });
    });

    // 監聽玩家斷開，清除畫面物件
    socket.on("dead", (id) => {
      if (this.players[id]) {
        this.players[id].sprite.setActive(false).setVisible(false);
        this.players[id].hpBar.setVisible(false);
        this.players[id].name.setVisible(false);
      }
    });

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

    this.keys = this.input.keyboard.addKeys({
      up: "W", down: "S", left: "A", right: "D", attack: "J", skill: "K",
    });

 create() {
  // 📌 修正：延遲 200 毫秒執行，確保手機/電腦的 DOM 容器已經完全渲染並抓得到
  this.time.delayedCall(200, () => {
    this.createJoystick();
  });
}

createJoystick() {
  this.joyX = 0;
  this.joyY = 0;

  // 📌 修正安全機制：如果找不到 game-container，就綁定到 body 上，確保一定能動
  const targetElement = document.getElementById("game-container") || document.body;

  this.joystick = nipplejs.create({
    zone: targetElement,
    mode: "static",
    position: { left: "100px", bottom: "100px" }, // 往內縮一點，避免觸控被手機邊緣手勢吃掉
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
    if (!me || !me.sprite.visible) return; // 死亡時停止控制

    // 讀取伺服器配置的該動物速度，若無則預設為 5
    const playerState = me.sprite.texture.key;
    const speed = 5; 

    let vx = 0;
    let vy = 0;

    // 1. 鍵盤輸入
    if (this.keys.left.isDown) vx = -speed;
    if (this.keys.right.isDown) vx = speed;
    if (this.keys.up.isDown) vy = -speed;
    if (this.keys.down.isDown) vy = speed;

    // 2. 搖桿輸入 (當鍵盤沒動時才觸發，避免兩者衝突)
    if (vx === 0 && vy === 0 && (this.joyX !== 0 || this.joyY !== 0)) {
      vx = this.joyX * speed;
      vy = this.joyY * speed * -1; // 反轉 Y 軸
    }

    // 3. 發送移動請求
    if (vx !== 0 || vy !== 0) {
      socket.emit("move", {
        x: me.sprite.x + vx,
        y: me.sprite.y + vy
      });
    }

    // 4. 普通攻擊 (J)
    if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      this.findAndAttack("attack");
    }

    // 5. 技能攻擊 (K)
    if (Phaser.Input.Keyboard.JustDown(this.keys.skill)) {
      const now = Date.now();
      if (now - this.lastSkill > 1000) {
        this.lastSkill = now;
        this.findAndAttack("skill");
      }
    }
  }

  // 尋找最近或合法的敵方目標進行攻擊
  findAndAttack(type) {
    Object.keys(this.players).forEach((id) => {
      if (id !== socket.id && this.players[id].sprite.visible) {
        socket.emit(type, id);
      }
    });
  }
}
