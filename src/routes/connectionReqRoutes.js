const express = require("express");

const connectionReqRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const {
  validationConnectionReqSend,
  validationConnectionReqReview,
} = require("../../utils/validation");
const { Connection } = require("mongoose");

// Send Connection request
connectionReqRouter.post(
  "/connectionReq/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    //   #swagger.tags = ["Connection Request"];
    //   #swagger.summary = "send a connection request";
    //   #swagger.description = "This endpoint send a connection request either interested or ignored.";
    try {
      await validationConnectionReqSend(req, res);

      if (res.headersSent) return; //  STOP HERE if validation already sent error response

      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const connectionReq = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      await connectionReq.save();

      return res.status(200).json({
        success: true,
        message: "Conection request send successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "connection request send failed",
      });
    }
  }
);

// Review Connection request
connectionReqRouter.post(
  "/connectionReq/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    //   #swagger.tags = ["Connection Request"];
    //   #swagger.summary = "review a connection request";
    //   #swagger.description = "This endpoint review a connection request either accepted or rejected.";
    try {
      await validationConnectionReqReview(req, res);

      if (res.headersSent) return;

      const loggedInUserId = req.user._id;
      const { status, requestId } = req.params;

      const connectionReq = await ConnectionRequest.findOne({
        _id: requestId,
        status: "interested",
        toUserId: loggedInUserId,
      });

      if (!connectionReq) {
        return res.status(400).json({
          success: false,
          message: "Connection request not found",
        });
      }

      connectionReq.status = status;

      await connectionReq.save();

      return res.status(200).json({
        success: true,
        message: "Connection review completed",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Connection request review failed",
      });
    }
  }
);

module.exports = connectionReqRouter;
