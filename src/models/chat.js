const mongoose = require("mongoose");
const User = require("./user");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const chatSchema = new mongoose.Schema(
  {
    chatKey: {
      type: String,
      unique: true,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    deletedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        deletedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    viewedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    messages: [messageSchema],
  },
  { timestamps: true },
);

const Chat = mongoose.model("chat", chatSchema);

module.exports = { Chat };
