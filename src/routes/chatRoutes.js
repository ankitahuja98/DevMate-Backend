const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { Chat } = require("../models/chat");
const chatRouter = express.Router();

chatRouter.get("/chat/:receiver", userAuth, async (req, res) => {
  //   #swagger.tags = ["Chat"];
  //   #swagger.summary = "Get user chat
  //   #swagger.description = "This endpoint is used for get user chat";
  try {
    const { receiver } = req.params;
    const sender = req.user._id;

    const limit = parseInt(req.query.size) || 25;
    const page = parseInt(req.query.page) || 1;

    let chatMeta = await Chat.findOne(
      {
        participants: { $all: [sender, receiver] },
      },
      { messages: 1 },
    );

    if (!chatMeta) {
      chatMeta = new Chat({
        participants: [sender, receiver],
        messages: [],
      });

      await chatMeta.save();
    }

    const totalMessages = chatMeta.messages.length;
    const end = totalMessages - (page - 1) * limit;
    const start = Math.max(end - limit, 0);
    const sliceSize = end - start;

    const chat = await Chat.findOne(
      {
        participants: { $all: [sender, receiver] },
      },
      { messages: { $slice: [start, sliceSize] } },
    ).populate("messages.senderId", "name");

    return res.status(200).json({
      totalMessages,
      data: chat,
      page,
      limit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
      error: error,
    });
  }
});

chatRouter.get("/chatList", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const chatList = await Chat.find(
      {
        participants: userId, // user must be in participants
        "messages.0": { $exists: true }, // at least 1 message
      },
      {
        messages: 0, // exclude messages field
      },
    )
      .populate({
        path: "participants",
        match: { _id: { $ne: userId } }, // exclude myself
        select: "name profilePhoto lastSeen isOnline",
      })
      .sort({ updateAt: -1 });

    const participants = chatList.map((chat) => chat.participants[0]);

    return res.status(200).json({
      data: participants,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
      error: error,
    });
  }
});

module.exports = chatRouter;
