const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();

// Get Connection Request
userRouter.get("/user/requests", userAuth, async (req, res) => {
  //   #swagger.tags = ["User"];
  //   #swagger.summary = "Get Connection Request";
  //   #swagger.description = "This endpoint is used for get connection request";
  try {
    const loggedInUserId = req.user._id;

    const requests = await ConnectionRequest.find({
      toUserId: loggedInUserId,
      status: "interested",
    }).populate("fromUserId", "name age");

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// Get Matches
userRouter.get("/user/matches", userAuth, async (req, res) => {
  //   #swagger.tags = ["User"];
  //   #swagger.summary = "Get Matches;
  //   #swagger.description = "This endpoint is used for get matches";
  try {
    const loggedInUserId = req.user._id;

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ fromUserId: loggedInUserId }, { toUserId: loggedInUserId }],
    })
      .populate("fromUserId", "name age")
      .populate("toUserId", "name age");

    const matches = connections.map((val) => {
      return val.fromUserId._id.toString() === loggedInUserId.toString()
        ? val.toUserId
        : val.fromUserId;
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
