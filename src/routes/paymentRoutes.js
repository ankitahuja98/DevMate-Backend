const express = require("express");
const { userAuth } = require("../middlewares/auth");
const razorpayinstance = require("../../utils/razorpay");
const Payment = require("../models/payment");
const payment = require("../models/payment");
const { validateWebhookSignature } = require("razorpay");
const User = require("../models/user");

const paymentRouter = express.Router();

// create an order
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  //   #swagger.tags = ["Payment"];
  //   #swagger.summary = "Create Order
  //   #swagger.description = "This endpoint is used to create payment order in razorpay";
  try {
    const { name } = req.user;

    const order = await razorpayinstance.orders.create({
      amount: 900,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        name: name,
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
paymentRouter.post("/payment/webhook", async (req, res) => {
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

    if (!isWebhookValid) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is invalid",
      });
    }

    const payment = await Payment.findOne({
      orderId: req.body.payload.payment.entity.order_id,
    });

    console.log("payment", payment);

    payment.status = "captured";
    await payment.save();

    const user = await User.findOne({ _id: payment.userId });
    user.isPremium = true;
    console.log("user", user);

    await user.save();

    return res.status(200).json({
      success: false,
      message: "Webhook received successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }
});

module.exports = paymentRouter;
