const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const { Chat } = require("../models/chat");

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
    }).populate("fromUserId", "-password -email -__v -createdAt -updatedAt");

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
      .populate("fromUserId", "-password -email -__v -createdAt -updatedAt")
      .populate("toUserId", "-password -email -__v -createdAt -updatedAt");

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

    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || undefined;
    const search = (req.query.search || "").trim();
    const role = (req.query.role || "").trim();
    const skill = (req.query.skill || "").trim();
    const experience = req.query.experience;
    const availability = (req.query.availability || "").trim();

    // find the user with whom you connected either you send the req or they send the req to you
    const requests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUserId }, // you send the req
        {
          // they send the req to you
          toUserId: loggedInUserId,
          status: { $ne: "interested" },
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

    // base query
    const query = {
      _id: { $nin: Array.from(excludedUserList) },
      isUserProfileCompleted: true,
      deletedAt: null,
    };

    // cursor logic (IMPORTANT)
    if (cursor) {
      query._id.$lt = new mongoose.Types.ObjectId(cursor);
    }

    // ── Search + advanced filters — applied server-side so a match on
    // page 3/4 (not yet fetched by the client) is still found instead of
    // only searching whatever's already loaded in the browser. ────────────
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [{ name: regex }, { currentRole: regex }, { techStack: regex }];
    }

    if (role) query.currentRole = role;
    if (skill) query.techStack = skill;
    if (availability) query.availability = availability;
    if (experience !== undefined && experience !== "" && !Number.isNaN(Number(experience))) {
      query.experience = Number(experience);
    }

    const feedUsers = await User.find(query)
      .select("-password -email -__v -createdAt -updatedAt")
      .sort({ _id: -1 })
      .limit(limit + 1);

    const hasMore = feedUsers.length > limit;

    if (hasMore) {
      feedUsers.pop();
    }

    const nextCursor =
      feedUsers.length > 0 ? feedUsers[feedUsers.length - 1]._id : null;

    res.status(200).json({ data: feedUsers, nextCursor, hasMore });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went Wrong",
    });
  }
});

module.exports = userRouter;
