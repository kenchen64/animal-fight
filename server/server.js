require('dotenv').config()

const express = require('express')
const http = require('http')
const mongoose = require('mongoose')
const cors = require('cors')

const { Server } = require('socket.io')

const authRoutes = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)

mongoose.connect(process.env.MONGO_URI)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

const players = {}

const stats = {
  dog: {
    hp: 200,
    damage: 15,
    crit: 0.1,
    speed: 3
  },
  cat: {
    hp: 120,
    damage: 10,
    crit: 0.15,
    speed: 6
  },
  fox: {
    hp: 140,
    damage: 12,
    crit: 0.35,
    speed: 4
  }
}

io.on('connection', socket => {
  console.log('player connected')

  socket.on('join', data => {
    const base = stats[data.animal]

    if (!base) {
      // 【修正1】修正引號為反單引號，確保字串插值能正確運作
      console.error(`動物類型錯誤 -> "${data.animal}"`);
      return;
    }

    players[socket.id] = {
      id: socket.id,
      username: data.username,
      animal: data.animal,
      x: 300,
      y: 300,
      hp: base.hp,
      maxHp: base.hp,
      damage: base.damage,
      crit: base.crit,
      speed: base.speed,
      dead: false
    }

    io.emit('players', players)
  })

  socket.on('move', data => {
    if (!players[socket.id]) return
    // 若玩家已死亡，限制其不能移動（優化體驗）
    if (players[socket.id].dead) return 

    players[socket.id].x = data.x
    players[socket.id].y = data.y

    io.emit('players', players)
  })

  socket.on('attack', targetId => {
    const attacker = players[socket.id]
    const target = players[targetId]

    if (!attacker || !target || attacker.dead || target.dead) return

    let damage = attacker.damage
    const crit = Math.random() < attacker.crit

    if (crit) {
      damage *= 2
    }

    target.hp -= damage

    io.emit('hit', {
      targetId,
      damage,
      crit
    })

    // 檢查死亡邏輯
    checkDeath(target, targetId);

    io.emit('players', players)
  })

  // 【修正2】擴充技能邏輯，使其不只放特效，還能確實造成傷害
  socket.on('skill', targetId => {
    const attacker = players[socket.id]
    const target = players[targetId]

    // 安全檢查：施法者或目標不存在、或有人已死亡則不觸發
    if (!attacker || !target || attacker.dead || target.dead) return

    // 技能設定為固定 1.5 倍的攻擊力，且無視暴擊
    const skillDamage = Math.floor(attacker.damage * 1.5);
    target.hp -= skillDamage;

    // 廣播大招特效給所有人
    io.emit('skillEffect', {
      from: socket.id,
      target: targetId
    })

    // 觸發扣血特效的事件（共用普通攻擊的 hit 監聽器，讓前端噴字）
    io.emit('hit', {
      targetId,
      damage: skillDamage,
      crit: true // 技能強制亮暴擊黃字
    })

    // 檢查目標是否被大招擊殺
    checkDeath(target, targetId);

    // 廣播更新全體玩家狀態（血條減少）
    io.emit('players', players)
  })

  socket.on('disconnect', () => {
    delete players[socket.id]
    io.emit('players', players)
  })
})

// 抽離出來的通用死亡與重生處理函式
function checkDeath(target, targetId) {
  if (target.hp <= 0) {
    target.hp = 0;
    target.dead = true;

    io.emit('dead', targetId);

    setTimeout(() => {
      // 3 秒後在隨機/指定位置復活並補滿血
      target.hp = target.maxHp;
      target.x = 100;
      target.y = 100;
      target.dead = false;

      io.emit('players', players);
    }, 3000)
  }
}

app.get('/', (req, res) => {
  res.send('Animal Brawl MMO Running')
})

server.listen(process.env.PORT || 10000, () => {
  console.log('server running')
})
