const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { sendEmail } = require("../../utils/sendCustomMail");
const otpGenerator = require("../../utils/otpGenerator");

const forgetPasswordRouter = express.Router();

// verify Email
forgetPasswordRouter.post("/forgetPassword/verifyEmail", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "No user exists with this email address.",
      });
    }

    const otp = otpGenerator();
    const otpHash = bcrypt.hashSync(otp.toString(), 10);

    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpResendCount = 0;
    user.otpLastSentAt = new Date();

    await user.save();

    await sendEmail(email, "forgotPassword", { otp });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

forgetPasswordRouter.post("/forgetPassword/resetPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide an credentials",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const user = await User.findOne({ email });

    if (!user && !user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "No user exists with this email address.",
      });
    }

    user.password = passwordHash;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

module.exports = forgetPasswordRouter;
