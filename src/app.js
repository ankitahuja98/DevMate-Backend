const cors = require("cors");
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/database");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");
const app = express();

// express.json() is a middleware which "Take incoming JSON and convert it into a JS object so we can read req.body"
app.use(express.json());

// cookieParser is a middleware which helps "reads cookies from the request header and available in req.cookies"
app.use(cookieParser());

// CORS Handling
app.use(
  cors({
    origin: "http://localhost:5173", // your Devmate frontend URL
    credentials: true, // if sending cookies / tokens
  })
);

//  API
app.post("/signup", async (req, res) => {
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

app.patch("/signup", async (req, res) => {
  try {
    let { email, password } = req.body;

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

app.post("/login", async (req, res) => {
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

app.get("/getProfile", userAuth, async (req, res) => {
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

// Connect with DB and start the server
connectDB()
  .then(() => {
    console.log("Database connected sucessfully...");
    app.listen(8080, () => {
      console.log("Server started Successfully in 8080...");
    });
  })
  .catch((err) => console.log(err));
