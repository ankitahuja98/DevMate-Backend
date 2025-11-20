const jwt = require("jsonwebtoken");
const User = require("../models/user");

// userAuth is a middleware to check the user jwt token and veriy user is authenticated or not.
const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    const decodeMsg = await jwt.verify(token, process.env.JWT_SecretKey);

    const { _id } = decodeMsg;

    const user = await User.findOne({ _id: _id });

    req.user = user;

    if (user) {
      next();
    } else {
      return res.status(500).json({
        success: false,
        message: "Something wentt wrong",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something wenttt wrong",
    });
  }
};

module.exports = { userAuth };
