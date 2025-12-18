const ConnectionRequest = require("../src/models/connectionRequest");
const User = require("../src/models/user");

function validateEditProfileData(req) {
  const allowedProps = [
    "name",
    "age",
    "profilePhoto",
    "tagline",
    "bio",
    "location",
    "currentRole",
    "experience",
    "lookingForTitle",
    "lookingForDesc",
    "interests",
    "availability",
    "techStack",
    "projects",
    "socialLinks",
    "isNewUser",
  ];

  const isValid = Object.keys(req.body).every((val) =>
    allowedProps.includes(val)
  );
  return isValid;
}

function validateForgetpasswordData(req, res) {
  const allowedProps = ["email", "password"];

  const isValid = Object.keys(req.body).every((val) =>
    allowedProps.includes(val)
  );

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid Payload",
    });
  }

  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  if (req.body.password.length < 4) {
    return res.status(400).json({
      success: false,
      message: "Password should contains more than 4 characters",
    });
  }

  return true;
}

async function validationConnectionReqSend(req, res) {
  const { toUserId, status } = req.params;
  const fromUserId = req.user._id;
  const allowedStatus = ["interested", "ignored"];

  const isValidStatus = allowedStatus.includes(status);

  if (!isValidStatus) {
    return res.status(400).json({
      success: false,
      message: "Invalid Status Type",
    });
  }

  const user = await User.findById(toUserId);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found",
    });
  }

  const alreadySentReq = await ConnectionRequest.findOne({
    fromUserId,
    toUserId,
  });

  if (alreadySentReq) {
    return res.status(400).json({
      success: false,
      message: "Already sent a request to this user",
    });
  }

  if (toUserId == fromUserId) {
    return res.status(400).json({
      success: false,
      message: "You are not allowed to send the request to yourself",
    });
  }

  return true;
}

async function validationConnectionReqReview(req, res) {
  const { requestId, status } = req.params;
  const allowedStatus = ["accepted", "rejected"];

  const isValidStatus = allowedStatus.includes(status);

  if (!isValidStatus) {
    return res.status(400).json({
      success: false,
      message: "Invalid Status Type",
    });
  }
}

module.exports = {
  validateEditProfileData,
  validateForgetpasswordData,
  validationConnectionReqSend,
  validationConnectionReqReview,
};
