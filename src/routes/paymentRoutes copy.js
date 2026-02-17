const express = require("express");
const { userAuth } = require("../middlewares/auth");
const razorpayinstance = require("../../utils/razorpay");
const Payment = require("../models/payment");

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
