import express from "express";
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const Player = require("./models/Player");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

mongoose.connect(
  "mongodb+srv://kenchen6464_db_user:Chen6464-@cluster0.9uzmb2u.mongodb.net/?appName=Cluster0"
);

const players = {};

const animalStats = {
  dog: {
    hp: 200,
    speed: 3,
    damage: 15,
    crit: 0.1,
  },
  cat: {
    hp: 120,
    speed: 6,
    damage: 10,
    crit: 0.1,
  },
  fox: {
    hp: 140,
    speed: 4,
    damage: 12,
    crit: 0.35,
  },
};

io.on("connection", (socket) => {
  console.log("玩家加入:", socket.id);

  socket.on("joinGame", async ({ name, animal }) => {
    const base = animalStats[animal];

    players[socket.id] = {
      id: socket.id,
      name,
      animal,
      x: 300,
      y: 300,
      hp: base.hp,
      maxHp: base.hp,
      speed: base.speed,
      damage: base.damage,
      crit: base.crit,
    };

    io.emit("players", players);

    await Player.create({
      playerId: socket.id,
      name,
      animal,
    });
  });

  socket.on("move", (data) => {
    if (!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].y = data.y;

    io.emit("players", players);
  });

  socket.on("attack", (targetId) => {
    const attacker = players[socket.id];
    const target = players[targetId];

    if (!attacker || !target) return;

    let dmg = attacker.damage;

    const isCrit = Math.random() < attacker.crit;

    if (isCrit) dmg *= 2;

    target.hp -= dmg;

    io.emit("damage", {
      targetId,
      dmg,
      isCrit,
    });

    if (target.hp <= 0) {
      target.hp = target.maxHp;
      target.x = 100;
      target.y = 100;
    }

    io.emit("players", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players", players);
  });
});

app.get("/", (req, res) => {
  res.send("Animal Brawl Server Running");
});

server.listen(10000, () => {
  console.log("Server running on 10000");
});
