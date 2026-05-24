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
  dog: { hp: 200, damage: 15, crit: 0.1, speed: 3 },
  cat: { hp: 120, damage: 10, crit: 0.15, speed: 6 },
  fox: { hp: 140, damage: 12, crit: 0.35, speed: 4 }
}

io.on('connection', socket => {
  console.log('player connected: ' + socket.id)

  socket.on('join', data => {
    const base = stats[data.animal]
    if (!base) {
      console.error(`動物類型錯誤 -> "${data.animal}"`);
      return;
    }

    players[socket.id] = {
      id: socket.id,
      username: data.username || "Unknown",
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

  // 【重大修正】：將原本包在裡面的 setInterval 移出！只做資料變更。
  socket.on('move', data => {
    if (!players[socket.id] || players[socket.id].dead) return;

    // 限制邊界避免玩家跑出地圖（假設地圖為 1920x1080）
    players[socket.id].x = Math.max(0, Math.min(1920, data.x));
    players[socket.id].y = Math.max(0, Math.min(1080, data.y));
  })

  socket.on('attack', targetId => {
    const attacker = players[socket.id]
    const target = players[targetId]

    if (!attacker || !target || attacker.dead || target.dead) return

    let damage = attacker.damage
    const crit = Math.random() < attacker.crit
    if (crit) damage *= 2

    target.hp -= damage

    io.emit('hit', { targetId, damage, crit })
    checkDeath(target, targetId);
  })

  socket.on('skill', targetId => {
    const attacker = players[socket.id]
    const target = players[targetId]

    if (!attacker || !target || attacker.dead || target.dead) return

    const skillDamage = Math.floor(attacker.damage * 1.5);
    target.hp -= skillDamage;

    io.emit('skillEffect', { from: socket.id, target: targetId })
    io.emit('hit', { targetId, damage: skillDamage, crit: true })

    checkDeath(target, targetId);
  })

  socket.on('disconnect', () => {
    console.log('player disconnected: ' + socket.id)
    delete players[socket.id]
    io.emit('players', players)
  })
})

// 【核心優化】全域定時廣播：每 50 毫秒統一同步一次所有玩家的位置
setInterval(() => {
  if (Object.keys(players).length > 0) {
    io.emit("players", players);
  }
}, 50);

function checkDeath(target, targetId) {
  if (target.hp <= 0) {
    target.hp = 0;
    target.dead = true;

    io.emit('dead', targetId);

    setTimeout(() => {
      target.hp = target.maxHp;
      target.x = 300; // 重生點
      target.y = 300;
      target.dead = false;
    }, 3000)
  }
}

app.get('/', (req, res) => {
  res.send('Animal Brawl MMO Running')
})

server.listen(process.env.PORT || 10000, () => {
  console.log('server running')
})
