const bcrypt = require("bcrypt");
const User = require("../models/user");

const express = require("express");
const authRouter = express.Router();

//  User Signup
authRouter.post("/signup", async (req, res) => {
  //   #swagger.tags = ["Auth"];
  //   #swagger.summary = "Register a new user";
  //   #swagger.description = "This endpoint registers a new user and returns a JWT token.";
  try {
    const { name, email, age, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    let user = new User({
      name,
      email,
      age,
      password: passwordHash,
    });
    await user.save();
    return res.status(200).json({
      success: true,
      message: "User save sucessfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email id is already registered",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// user login
authRouter.post("/login", async (req, res) => {
  //   #swagger.tags = ["Auth"];
  //   #swagger.summary = "Login a user";
  //   #swagger.description = "This endpoint logs in a user and returns a token in cookie.";
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const ispasswordValid = await user.ValidatePassword(password);

    if (ispasswordValid) {
      const token = await user.getJWT();
      res.cookie("token", token);

      return res.status(200).json({
        success: true,
        message: "User authenicated! Login successful",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

//user logout
authRouter.post("/logout", async (req, res) => {
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'User logout'
  // #swagger.description = 'This endpoint logs out a user by clearing the cookie.'
  try {
    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

module.exports = authRouter;
