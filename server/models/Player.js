const mongoose = require('mongoose')

const PlayerSchema = new mongoose.Schema({
  username: String,
  password: String,

  animal: {
    type: String,
    default: 'dog'
  },

  level: {
    type: Number,
    default: 1
  },

  hp: {
    type: Number,
    default: 100
  },

  coins: {
    type: Number,
    default: 0
  },

  x: {
    type: Number,
    default: 300
  },

  y: {
    type: Number,
    default: 300
  }
})

module.exports = mongoose.model('Player', PlayerSchema)