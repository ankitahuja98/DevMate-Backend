const express = require("express");
const { userAuth } = require("../middlewares/auth");
const razorpayinstance = require("../../utils/razorpay");
const Payment = require("../models/payment");
const payment = require("../models/payment");

const paymentRouter = express.Router();

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const order = await razorpayinstance.orders.create({
      amount: 5000,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        name: "Ankit",
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

module.exports = paymentRouter;
