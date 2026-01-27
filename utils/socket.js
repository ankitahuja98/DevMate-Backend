const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../src/models/chat");
const mongoose = require("mongoose");
const User = require("../src/models/user");
const socketAuth = require("../src/middlewares/socketAuth");

const getRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.user._id;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
      });
    }

    socket.on("joinChat", ({ userId, targetUserId }) => {
      const roomId = getRoomId(userId, targetUserId);
      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ sender, receiver, message }) => {
      // save my message into the db
      try {
        const roomId = getRoomId(sender._id, receiver);

        let chat = await Chat.findOne({
          participants: { $all: [sender._id, receiver] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [sender._id, receiver],
            messages: [],
          });
        }
        chat.messages.push({
          senderId: sender._id,
          message,
        });

        await chat.save();
        io.to(roomId).emit("newMessageReceived", {
          _id: chat.messages[chat.messages.length - 1]._id,
          senderId: sender, // full object
          message,
        });
      } catch (error) {
        console.log("send msg error:", error);
      }
    });

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      console.log("User disconnected");
    });
  });
};

module.exports = initializeSocket;
