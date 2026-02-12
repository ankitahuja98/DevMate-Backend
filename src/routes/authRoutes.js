const bcrypt = require("bcrypt");
const User = require("../models/user");

const express = require("express");
const { sendEmail } = require("../../utils/sendCustomMail");
const otpGenerator = require("../../utils/otpGenerator");
const authRouter = express.Router();

//  User Signup
authRouter.post("/auth/signup", async (req, res) => {
  //   #swagger.tags = ["Auth"];
  //   #swagger.summary = "Register a new user";
  //   #swagger.description = "This endpoint registers a new user and returns a JWT token.";
  try {
    const { name, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = otpGenerator();
    const otpHash = bcrypt.hashSync(otp.toString(), 10);
    const existingUser = await User.findOne({ email }).select("+password");

    // Case 1: User exists and active → block signup
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Case 2: User exists but NOT verified OR soft-deleted → override
    if (existingUser) {
      existingUser.name = name;
      existingUser.password = passwordHash;
      existingUser.deletedAt = null;
      existingUser.isVerified = false;

      existingUser.otpHash = otpHash;
      existingUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      existingUser.otpAttempts = 0;
      existingUser.otpResendCount = 0;
      existingUser.otpLastSentAt = new Date();

      await existingUser.save();

      await sendEmail(email, "signup", { otp });

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    }

    // Case 3: Create new user
    let user = new User({
      name,
      email,
      password: passwordHash,
      otpHash,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
      otpResendCount: 0,
      otpLastSentAt: new Date(),
    });
    await user.save();

    await sendEmail(email, "signup", { otp: otp });

    return res.status(200).json({
      success: true,
      message: "User registered sucessfully",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

authRouter.post("/auth/verifyEmail", async (req, res) => {
  //   #swagger.tags = ["OTP"];
  //   #swagger.summary = "verifyEmail via Otp";
  //   #swagger.description = "This endpoint verifyEmail a email via otp.";
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please click the Resend button.",
      });
    }

    let isOtpValid = await user.validateOtp(otp);

    if (!isOtpValid) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    } else {
      user.isVerified = true;
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

authRouter.post("/auth/resendOtp", async (req, res) => {
  //   #swagger.tags = ["OTP"];
  //   #swagger.summary = "resendOtp";
  //   #swagger.description = "This endpoint resend Otp for email verification";
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resend_Window = 15 * 60 * 1000;

    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() > resend_Window
    ) {
      user.otpResendCount = 0;
    }

    if (user.otpResendCount >= 5) {
      return res.status(429).json({
        success: false,
        message: "Resend limit reached. Please try again after 15 minutes.",
      });
    }

    const otp = otpGenerator();
    const otpHash = bcrypt.hashSync(otp.toString(), 10);

    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpLastSentAt = new Date();
    user.otpAttempts = 0;
    user.otpResendCount += 1;

    await user.save();

    await sendEmail(email, "signup", { otp });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// user login
authRouter.post("/auth/login", async (req, res) => {
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

    if (!user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "Please verify your email",
      });
    }

    if (user.deletedAt) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted",
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
authRouter.post("/auth/logout", async (req, res) => {
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
