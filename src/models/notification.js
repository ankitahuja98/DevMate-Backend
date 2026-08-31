const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // recipient of the notification
    },
    type: {
      type: String,
      enum: {
        values: ["connection_request", "connection_accepted", "premium_purchase"],
        message: `{VALUE} is incorrect notification type`,
      },
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // who triggered the notification, if applicable
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // e.g. ConnectionRequest._id or Payment._id
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
