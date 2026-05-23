const token = jwt.sign(
  {
    id: user._id,
    username: user.username,
  },
  process.env.JWT_SECRET
);
