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

    const size = parseInt(req.query.size) || 25;
    const page = parseInt(req.query.page) || 1;

    let chatMeta = await Chat.findOne(
      {
        participants: { $all: [sender, receiver] },
      },
      { messages: 1, deletedBy: 1 },
    ).populate("messages.senderId", "name");

    if (!chatMeta) {
      chatMeta = new Chat({
        participants: [sender, receiver],
        messages: [],
        viewedBy: [],
        deletedBy: [],
      });
      await chatMeta.save();
    }

    const alreadyViewed = chatMeta.viewedBy?.find(
      (val) => val.userId.toString() === sender.toString(),
    );

    // if (alreadyViewed) {
    //   alreadyViewed.viewedAt = new Date();
    // } else {
    //   chatMeta.viewedBy.push({
    //     userId: sender,
    //     viewedAt: new Date(),
    //   });
    // }
    // await chatMeta.save();

    const deletedRecord = chatMeta.deletedBy?.find(
      (d) => d.userId.toString() === sender.toString(),
    );
    const deletedAt = deletedRecord?.deletedAt || new Date(0);

    const filteredMessage = chatMeta.messages.filter(
      (val) => new Date(val.createdAt) > deletedAt,
    );

    const totalMessages = filteredMessage.length;
    const end = totalMessages - (page - 1) * size;
    const start = Math.max(end - size, 0);
    const paginatedMessages = filteredMessage.slice(start, end);

    return res.status(200).json({
      totalMessages,
      data: paginatedMessages,
      page,
      size,
    });
  } catch (error) {
    console.log("error", error);
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
      { messages: 0 }, // exclude messages
    )
      .populate({
        path: "participants",
        match: { _id: { $ne: userId } }, // exclude myself,
        select: "name profilePhoto lastSeen isOnline",
      })
      .sort({ updatedAt: -1 });

    // const participants = chatList;
    const participants = chatList
      .filter((chat) => {
        const deleteRecord = chat.deletedBy?.find(
          (d) => d.userId.toString() === userId.toString(),
        );

        if (!deleteRecord) return true;

        return new Date(chat.updatedAt) > new Date(deleteRecord.deletedAt);
      })
      .map((chat) => chat.participants[0]);

    return res.status(200).json({
      data: participants,
    });
  } catch (error) {
    console.log("ChatList-error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
      error: error,
    });
  }
});

chatRouter.post("/chatDelete/:targetUserId", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    const result = await Chat.updateOne(
      {
        participants: { $all: [userId, targetUserId] },
      },
      {
        $pull: { deletedBy: { userId: userId } },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    await Chat.updateOne(
      {
        participants: { $all: [userId, targetUserId] },
      },
      {
        $push: { deletedBy: { userId, userId, deletedAt: new Date() } },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: `Chat deleted successfully`,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
});

module.exports = chatRouter;
