const socket = require("socket.io");
const crypto = require("crypto");

const getRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: true, // allow same-origin
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ userId, targetUserId }) => {
      const roomId = getRoomId(userId, targetUserId);
      console.log("roomId", roomId);
      socket.join(roomId);
    });

    socket.on("sendMessage", ({ sender, receiver, message }) => {
      console.log("all details", sender, receiver, message);
      const roomId = getRoomId(sender, receiver);
      io.to(roomId).emit("newMessageReceived", { sender, receiver, message });
    });

    socket.on("disconnet", () => {});
  });
};

module.exports = initializeSocket;
