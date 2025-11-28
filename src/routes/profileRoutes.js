const { userAuth } = require("../middlewares/auth");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const express = require("express");
const {
  validateEditProfileData,
  validateForgetpasswordData,
} = require("../../utils/validation");
const profileRouter = express.Router();

// get profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  //   #swagger.tags = ["Profile"];
  //   #swagger.summary = "Get user profile";
  //   #swagger.description = "This endpoint get a user profile data.";
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      message: "Fetched user data successfully",
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

    await validateForgetpasswordData(req, res);

    if (res.headersSent) return; //  STOP HERE if validation already sent error response

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
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  //   #swagger.tags = ["Profile"];
  //   #swagger.summary = "Edit profile";
  //   #swagger.description = "This endpoint is used for edit the user data.";
  try {
    const user = req.user;

    if (!validateEditProfileData(req)) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
      });
    }

    Object.keys(req.body).forEach((key) => (user[key] = req.body[key]));

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Your profile has been updated sucessfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

module.exports = profileRouter;
