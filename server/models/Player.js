const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  playerId: String,
  name: String,
  animal: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Player", PlayerSchema);