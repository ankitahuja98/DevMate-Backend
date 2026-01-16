const { Template$ } = require("@aws-sdk/client-ses");
const mongoose = require("mongoose");

const payment = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    receipt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "created",
        "attempted",
        "captured",
        "failed",
        "refunded",
        "verified",
      ],
      default: "created",
    },
    notes: {
      name: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", payment);
