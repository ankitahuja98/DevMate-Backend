const { userAuth } = require("../middlewares/auth");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const express = require("express");
const profileRouter = express.Router();

// get profile
profileRouter.get("/getProfile", userAuth, async (req, res) => {
  //   #swagger.tags = ["Profile"];
  //   #swagger.summary = "Get user profile";
  //   #swagger.description = "This endpoint get a user profile data.";
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      message: "Data...",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// Forget Password
profileRouter.patch("/forgetPassword", async (req, res) => {
  //   #swagger.tags = ["Profile"];
  //   #swagger.summary = "Forget Password";
  //   #swagger.description = "This endpoint is used for forget the password.";
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password should contains more than 4 characters",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not exists!",
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { email },
      { password: passwordHash },
      { new: true, runValidators: true, validateModifiedOnly: true }
    );
    return res.status(200).json({
      success: true,
      message: "Your password changed sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// edit profile
profileRouter.patch("/editProfile", userAuth, async (req, res) => {
  //   #swagger.tags = ["Profile"];
  //   #swagger.summary = "Edit profile";
  //   #swagger.description = "This endpoint is used for edit the user data.";
  try {
    const user = req.user;
    const { _id } = user;
    let { name, age, password } = req.body;

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await User.findOneAndUpdate(
      { _id },
      {
        name: name || user.name,
        age: age || user.age,
        password: passwordHash || user.password,
      },
      { new: true, runValidators: true, validateModifiedOnly: true }
    );
    return res.status(200).json({
      success: true,
      message: "Your profile has been updated sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

module.exports = profileRouter;
