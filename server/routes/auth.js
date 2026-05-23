const express = require("express");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const Player =
  require("../models/Player");

const router = express.Router();

router.post(
  "/register",
  async (req, res) => {

    const {
      username,
      password,
    } = req.body;

    const exist =
      await Player.findOne({
        username,
      });

    if (exist) {
      return res.status(400).json({
        error: "帳號已存在",
      });
    }

    const hashed =
      await bcrypt.hash(
        password,
        10
      );

    const user =
      await Player.create({
        username,
        password: hashed,
      });

    res.json(user);
  }
);

router.post(
  "/login",
  async (req, res) => {

    const {
      username,
      password,
    } = req.body;

    const user =
      await Player.findOne({
        username,
      });

    if (!user) {
      return res.status(400).json({
        error: "找不到玩家",
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!valid) {
      return res.status(400).json({
        error: "密碼錯誤",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username:
          user.username,
      },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      user,
    });
  }
);

module.exports = router;
