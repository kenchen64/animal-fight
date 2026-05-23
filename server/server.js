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

    players[socket.id].x = data.x
    players[socket.id].y = data.y

    io.emit('players', players)
  })

  socket.on('attack', targetId => {
    const attacker = players[socket.id]
    const target = players[targetId]

    if (!attacker || !target) return

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

    if (target.hp <= 0) {
      target.dead = true

      io.emit('dead', targetId)


      setTimeout(() => {
        target.hp = target.maxHp
        target.x = 100
        target.y = 100
        target.dead = false

        io.emit('players', players)
      }, 3000)
    }

    io.emit('players', players)
  })

  socket.on('skill', targetId => {
    io.emit('skillEffect', {
      from: socket.id,
      target: targetId
    })
  })

  socket.on('disconnect', () => {
    delete players[socket.id]

    io.emit('players', players)
  })
})

app.get('/', (req, res) => {
  res.send('Animal Brawl MMO Running')
})

server.listen(process.env.PORT || 10000, () => {
  console.log('server running')
})