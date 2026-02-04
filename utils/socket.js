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

const getChatKey = (userId, targetUserId) => {
  return [userId.toString(), targetUserId.toString()].sort().join("_");
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
        const chatKey = getChatKey(userId, receiver);
        const now = new Date();

        const chat = await Chat.findOneAndUpdate(
          { chatKey },
          {
            $push: { messages: { senderId: userId, message } },
            $setOnInsert: {
              chatKey,
              participants: [userId, receiver],
              viewedBy: [],
              deletedBy: [],
            },
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

        // 1. Always mark sender as viewed
        await Chat.updateOne(
          { chatKey, "viewedBy.userId": userId },
          { $set: { "viewedBy.$.viewedAt": now } },
        );

        await Chat.updateOne(
          { chatKey, "viewedBy.userId": { $ne: userId } },
          { $push: { viewedBy: { userId, viewedAt: now } } },
        );

        // 2. Check if receiver is in room (chat open)
        const socketsInRoom = await io.in(roomId).fetchSockets();

        const receiverInRoom = socketsInRoom.some(
          (s) => s.user?._id.toString() === receiver.toString(),
        );

        if (receiverInRoom) {
          // ✅ Update viewedBy for receiver
          const now = new Date();

          const updateResult = await Chat.updateOne(
            { chatKey, "viewedBy.userId": receiver },
            { $set: { "viewedBy.$.viewedAt": now } },
          );

          if (updateResult.matchedCount === 0) {
            await Chat.updateOne(
              { chatKey },
              { $push: { viewedBy: { userId: receiver, viewedAt: now } } },
            );
          }
        }
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
