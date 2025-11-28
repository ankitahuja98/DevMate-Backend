const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();

// Get Matches
userRouter.get("/user/matches", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const matches = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ fromUserId: loggedInUserId }, { toUserId: loggedInUserId }],
    });

    return res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went Wrong",
    });
  }
});

module.exports = userRouter;
