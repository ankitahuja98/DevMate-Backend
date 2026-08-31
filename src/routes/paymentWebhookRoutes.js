const express = require("express");
const { validateWebhookSignature } = require("razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const { createAndEmitNotification } = require("../../utils/notify");

const PaymentWebhookRouter = express.Router();

// verify the payment its sucess or fail
PaymentWebhookRouter.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    //   #swagger.tags = ["Payment"];
    //   #swagger.summary = "Payment done via webhook
    //   #swagger.description = "This endpoint is used to done the payment either its captured or rejected";
    try {
      const webhookSignature = req.get("X-Razorpay-Signature");
      console.log("webhookSignature", webhookSignature);

      const isWebhookValid = validateWebhookSignature(
        req.body.toString(),
        webhookSignature,
        process.env.Razorpay_Webhook_Secret,
      );

      console.log("isWebhookValid", isWebhookValid);

      if (!isWebhookValid) {
        return res.status(400).json({
          success: false,
          message: "Webhook signature is invalid",
        });
      }

      // respond quickly to Razorpay
      res.status(200).json({
        success: true,
        message: "Webhook received successfully",
      });

      // parse JSON AFTER verification
      const body = JSON.parse(req.body.toString());

      // Ignore events other than payment.captured
      if (body.event !== "payment.captured") return;

      const orderId = body.payload.payment.entity.order_id;

      const payment = await Payment.findOne({ orderId });

      if (!payment) return console.log("Payment not found for order:", orderId);

      // Idempotency check — avoid double processing
      if (payment.status === "captured") return;
      payment.status = "captured";
      await payment.save();

      const user = await User.findOne({ _id: payment.userId });
      if (!user) return console.log("User not found");

      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);

      user.isPremium = true;
      user.premiumExpiresAt = expiry;
      await user.save();

      createAndEmitNotification({
        userId: payment.userId,
        type: "premium_purchase",
        message: "🎉 Payment successful! You're now a Pro member.",
        relatedId: payment._id,
      });
    } catch (error) {
      console.error("Webhook processing error:", error);
    }
  },
);

module.exports = PaymentWebhookRouter;
