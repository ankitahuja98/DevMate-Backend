const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const socketAuth = async (socket, next) => {
  try {
    // 1. Read cookie header from socket handshake
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("No cookie found"));
    }

    // 2. parse token from cookies;
    const cookies = cookie.parse(cookieHeader);
    const token = cookies.token;

    if (!token) {
      return next(new Error("No token Found"));
    }

    // 3. verify jwt
    const decodeMsg = await jwt.verify(token, process.env.JWT_SecretKey);

    const { _id } = decodeMsg;

    const user = await User.findOne({ _id: _id }).select(
      "-password -__v -createdAt -updatedAt",
    );

    socket.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    next(new Error("Unauthorised!"));
  }
};

module.exports = socketAuth;
