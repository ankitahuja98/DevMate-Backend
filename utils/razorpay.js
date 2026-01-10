const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: process.env.RazorpayKey_Id,
  key_secret: process.env.RazorpayKey_Secret,
});

module.exports = instance;
