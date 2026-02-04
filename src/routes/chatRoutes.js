const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { Chat } = require("../models/chat");
const { Socket } = require("socket.io");
const mongoose = require("mongoose");
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

    const participants = [sender.toString(), receiver.toString()].sort();
    const chatKey = participants.join("_");

    const chatMeta = await Chat.findOneAndUpdate(
      { chatKey },
      {
        $setOnInsert: {
          chatKey,
          participants,
          messages: [],
          viewedBy: [],
          deletedBy: [],
        },
      },
      {
        new: true,
        upsert: true,
        projection: { messages: 1, deletedBy: 1 },
      },
    ).populate("messages.senderId", "name");

    // if (!chatMeta) {
    //   chatMeta = new Chat({
    //     participants: participants,
    //     messages: [],
    //     viewedBy: [],
    //     deletedBy: [],
    //   });
    //   await chatMeta.save();
    // }

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

    const chatList = await Chat.find({
      participants: userId, // user must be in participants
      "messages.0": { $exists: true }, // at least 1 message
    })
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
      .map((chat) => {
        const otherUser = chat.participants[0];

        const lastmessage =
          chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1]
            : null;

        const viewedRecord = chat.viewedBy.find(
          (val) => val.userId.toString() === userId.toString(),
        );
        const viewedAt = viewedRecord?.viewedAt || new Date(0);

        const isUnread =
          lastmessage &&
          new Date(lastmessage.createdAt) > viewedAt &&
          lastmessage.senderId.toString() !== userId.toString();

        return {
          chatId: chat._id,
          user: otherUser,
          lastmessage,
          isUnread,
        };
      });

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

    const participants = [userId.toString(), targetUserId.toString()].sort();
    const chatKey = participants.join("_");

    const result = await Chat.updateOne(
      {
        chatKey,
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
        chatKey,
      },
      {
        $push: { deletedBy: { userId: userId, deletedAt: new Date() } },
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

chatRouter.post(
  "/chat/markMessagesAsRead/:targetUserId",
  userAuth,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { targetUserId } = req.params;
      const now = new Date();
      const participants = [userId.toString(), targetUserId.toString()].sort();
      const chatKey = participants.join("_");

      let chat = await Chat.findOne({
        chatKey,
      });

      if (!chat) {
        return res.status(200).json({
          success: true,
          message: "Chat not created yet",
        });
      }

      // 3. Try to update existing viewedBy entry
      const updateResult = await Chat.updateOne(
        {
          _id: chat._id,
          "viewedBy.userId": userId,
        },
        {
          $set: { "viewedBy.$.viewedAt": now },
        },
      );

      // 4. If no entry existed → push new one
      if (updateResult.matchedCount === 0) {
        await Chat.updateOne(
          { _id: chat._id },
          {
            $push: {
              viewedBy: { userId, viewedAt: now },
            },
          },
        );
      }

      return res.status(200).json({
        success: true,
        message: "Message marked as read successfully!",
      });
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  },
);

module.exports = chatRouter;
