const express = require("express");
const { userAuth } = require("../middlewares/auth");
const razorpayinstance = require("../../utils/razorpay");
const Payment = require("../models/payment");
const { validateWebhookSignature } = require("razorpay");
const User = require("../models/user");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const paymentRouter = express.Router();

// create an order
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  //   #swagger.tags = ["Payment"];
  //   #swagger.summary = "Create Order
  //   #swagger.description = "This endpoint is used to create payment order in razorpay";
  try {
    const { name, email } = req.user;

    const order = await razorpayinstance.orders.create({
      amount: 900,
      currency: "INR",
      receipt: uuidv4(),
      notes: {
        name,
        email,
      },
    });

    let payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      notes: order.notes,
    });
    const savedPayment = await payment.save();
    return res.status(200).json({
      success: true,
      message: "order created succesffully",
      ...savedPayment.toJSON(),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }
});

// verify the payment its sucess or fail
paymentRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    //   #swagger.tags = ["Payment"];
    //   #swagger.summary = "Payment done via webhook
    //   #swagger.description = "This endpoint is used to done the payment either its captured or rejected";
    try {
      const webhookSignature = req.get("X-Razorpay-Signature");
      console.log("webhookSignature", webhookSignature);

      const isWebhookValid = validateWebhookSignature(
        req.body,
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

      if (body.event !== "payment.captured") return;

      const orderId = body.payload.payment.entity.order_id;

      const payment = await Payment.findOne({ orderId });

      if (!payment) return console.log("Payment not found for order:", orderId);

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
    } catch (error) {
      console.error("Webhook processing error:", error);
    }
  },
);

paymentRouter.post("/payment/verify", userAuth, async (req, res) => {
  //   #swagger.tags = ["Payment"];
  //   #swagger.summary = "Payment Verify
  //   #swagger.description = "This endpoint is used to verify the payment either its captured or rejected";
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    // Validate request body
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details",
      });
    }

    // Generate expected signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RazorpayKey_Secret)
      .update(body)
      .digest("hex");

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified. Premium will activate shortly.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = paymentRouter;
