const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const userRouter = express.Router();

// Get Connection Request
userRouter.get("/user/requests", userAuth, async (req, res) => {
  //   #swagger.tags = ["User"]
  //   #swagger.summary = "Get Connection Request"
  //   #swagger.description = "This endpoint is used for get connection request"
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
  //   #swagger.tags = ["User"]
  //   #swagger.summary = "Get Matches
  //   #swagger.description = "This endpoint is used for get matches"
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

// Get all user -- feed API
userRouter.get("/feed", userAuth, async (req, res) => {
  //   #swagger.tags = ["User"];
  //   #swagger.summary = "Get Feed
  //   #swagger.description = "This endpoint is used for get feed, all the other user profile";
  try {
    const loggedInUserId = req.user._id;

    // find the user with whom you connected either you send the req or they send the req to you
    const requests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUserId }, // you send the req
        {
          // they send the req to you
          toUserId: loggedInUserId,
          status: { $ne: ["interested"] },
        },
      ],
    }).select("fromUserId toUserId");

    // Convert excluded user IDs into a set
    const excludedUserList = new Set();

    requests.forEach((val) => {
      excludedUserList.add(val.fromUserId.toString());
      excludedUserList.add(val.toUserId.toString());
    });

    // Also exclude self
    excludedUserList.add(loggedInUserId.toString());

    const feedUsers = await User.find({
      _id: { $nin: Array.from(excludedUserList) },
    }).select("name age");

    res.status(200).json({ data: feedUsers });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went Wrong",
    });
  }
});

module.exports = userRouter;
