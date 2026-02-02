const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../src/models/chat");
const User = require("../src/models/user");
const socketAuth = require("../src/middlewares/socketAuth");

const getRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId.toString(), targetUserId.toString()].sort().join("_"))
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
    if (!socket.user) {
      return socket.disconnect();
    }

    const userId = socket.user._id;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
      });
    }

    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = getRoomId(userId, targetUserId);
      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ receiver, message, tempId }) => {
      // save my message into the db
      try {
        if (!receiver || !message) return;

        const roomId = getRoomId(userId, receiver);

        const chat = await Chat.findOneAndUpdate(
          { participants: { $all: [userId, receiver] } },
          {
            $push: { messages: { senderId: userId, message } },
            $setOnInsert: { participants: [userId, receiver] },
          },
          {
            new: true,
            upsert: true,
            projection: { messages: { $slice: -1 } },
          },
        );

        const savedMessage = chat.messages[chat.messages.length - 1];

        const messagePayload = {
          _id: savedMessage._id,
          tempId,
          senderId: {
            _id: userId,
            name: socket.user?.name || "Unknown",
          },
          message,
          createdAt: savedMessage.createdAt || new Date(),
        };

        io.to(roomId).emit("newMessageReceived", messagePayload);
      } catch (error) {
        console.log("send msg error:", error);
      }
    });

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });
};

module.exports = initializeSocket;
