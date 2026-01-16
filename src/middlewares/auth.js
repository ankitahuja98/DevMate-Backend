const jwt = require("jsonwebtoken");
const User = require("../models/user");

// userAuth is a middleware to check the user jwt token and veriy a user is authenticated or not.
const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user!",
      });
    }

    const decodeMsg = await jwt.verify(token, process.env.JWT_SecretKey);

    const { _id } = decodeMsg;

    const user = await User.findById({ _id: _id }).select(
      "-password -__v -createdAt -updatedAt"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user!",
      });
    }

    // PREMIUM EXPIRY CHECK
    if (
      user.isPremium &&
      user.premiumExpiresAt &&
      user.premiumExpiresAt < new Date()
    ) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      await user.save();
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized user!",
    });
  }
};

module.exports = { userAuth };
