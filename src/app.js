const cors = require("cors");
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // your Devmate frontend URL
    credentials: true, // if sending cookies / tokens
  })
);

app.use(express.json()); // middleware how handle json data into the javascript which server can understand.

app.post("/signup", async (req, res) => {
  try {
    let user = new User(req.body);
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
    return res.status(400).json({
      success: false,
      message: "User did not save sucessfully",
      error: error.message,
    });
  }
});

app.patch("/signup", async (req, res) => {
  try {
    let { email, password } = req.body;
    await User.findOneAndUpdate(
      { email },
      { password },
      { new: true, runValidators: true, validateModifiedOnly: true }
    );
    return res.status(200).json({
      success: true,
      message: "Your password changed sucessfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Sorry! didn't update your password sucessfully",
      error: error.message,
    });
  }
});

app.get("/login", (req, res) => {
  res.send("welcome!");
});

connectDB()
  .then(() => {
    console.log("Database connected sucessfully...");
    app.listen(8080, () => {
      console.log("Server started Successfully in 8080...");
    });
  })
  .catch((err) => console.log(err));
