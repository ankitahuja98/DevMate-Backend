const express = require("express");

const notificationRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const Notification = require("../models/notification");

// Get paginated notifications for the logged-in user
notificationRouter.get("/notifications", userAuth, async (req, res) => {
  //   #swagger.tags = ["Notification"];
  //   #swagger.summary = "get notifications";
  //   #swagger.description = "This endpoint returns the logged-in user's notifications, newest first.";
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const size = Math.min(parseInt(req.query.size) || 20, 50);

    const [data, total] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .populate("relatedUserId", "name profilePhoto")
        .lean(),
      Notification.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data,
      total,
      page,
      size,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Fetching notifications failed",
    });
  }
});

// Get unread notification count for the logged-in user
notificationRouter.get(
  "/notifications/unread-count",
  userAuth,
  async (req, res) => {
    //   #swagger.tags = ["Notification"];
    //   #swagger.summary = "get unread notification count";
    //   #swagger.description = "This endpoint returns the number of unread notifications for the logged-in user.";
    try {
      const count = await Notification.countDocuments({
        userId: req.user._id,
        isRead: false,
      });

      return res.status(200).json({
        success: true,
        message: "Unread count fetched successfully",
        count,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Fetching unread count failed",
      });
    }
  },
);

// Mark a single notification as read
notificationRouter.patch(
  "/notifications/:id/read",
  userAuth,
  async (req, res) => {
    //   #swagger.tags = ["Notification"];
    //   #swagger.summary = "mark notification as read";
    //   #swagger.description = "This endpoint marks a single notification, owned by the logged-in user, as read.";
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: { isRead: true } },
        { new: true },
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Marking notification as read failed",
      });
    }
  },
);

// Mark all notifications as read for the logged-in user
notificationRouter.patch(
  "/notifications/read-all",
  userAuth,
  async (req, res) => {
    //   #swagger.tags = ["Notification"];
    //   #swagger.summary = "mark all notifications as read";
    //   #swagger.description = "This endpoint marks all of the logged-in user's unread notifications as read.";
    try {
      await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } },
      );

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Marking all notifications as read failed",
      });
    }
  },
);

// Delete all notifications for the logged-in user
notificationRouter.delete(
  "/notifications/clear-all",
  userAuth,
  async (req, res) => {
    //   #swagger.tags = ["Notification"];
    //   #swagger.summary = "clear all notifications";
    //   #swagger.description = "This endpoint permanently deletes all of the logged-in user's notifications.";
    try {
      await Notification.deleteMany({ userId: req.user._id });

      return res.status(200).json({
        success: true,
        message: "All notifications cleared",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Clearing notifications failed",
      });
    }
  },
);

module.exports = notificationRouter;
