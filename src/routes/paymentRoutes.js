const express = require("express");
const { userAuth } = require("../middlewares/auth");
const razorpayinstance = require("../../utils/razorpay");
const Payment = require("../models/payment");
const payment = require("../models/payment");
const { validateWebhookSignature } = require("razorpay");
const User = require("../models/user");
const { v4: uuidv4 } = require("uuid");

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
paymentRouter.post("/test/payment/webhook", async (req, res) => {
  //   #swagger.tags = ["Payment"];
  //   #swagger.summary = "Get payment verification
  //   #swagger.description = "This endpoint is used to verify the payment either its captured or rejected";
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");
    console.log("webhookSignature", webhookSignature);

    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.Razorpay_Webhook_Secret
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

    if (req.body.event !== "payment.captured") return;

    const payment = await Payment.findOne({
      orderId: req.body.payload.payment.entity.order_id,
    });
    if (!payment) return console.log("Payment not found for order:", orderId);

    console.log("payment", payment);

    payment.status = "captured";
    await payment.save();

    const user = await User.findOne({ _id: payment.userId });
    if (!user) return console.log("User not found");
    console.log("user", user);

    user.isPremium = true;
    await user.save();
  } catch (error) {
    console.error("Webhook processing error:", error);
  }
});

module.exports = paymentRouter;
