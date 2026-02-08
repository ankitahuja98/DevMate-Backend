const crypto = require("crypto");

const otpGenerator = () => {
  const otp = crypto.randomInt(100000, 1000000);

  return otp;
};

module.exports = otpGenerator;
