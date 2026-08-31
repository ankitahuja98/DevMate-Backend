const Notification = require("../src/models/notification");
const { emitToUser } = require("./socket");

// Saves a notification for `userId` and pushes it to them live over
// socket.io (event: "newNotification") if they're currently connected.
// Never throws — a notification failure must not break the flow (a
// connection request or a payment webhook) that triggered it.
const createAndEmitNotification = async ({
  userId,
  type,
  message,
  relatedUserId,
  relatedId,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      relatedUserId,
      relatedId,
    });

    emitToUser(userId, "newNotification", notification);

    return notification;
  } catch (error) {
    console.log("createAndEmitNotification error:", error);
  }
};

module.exports = { createAndEmitNotification };
