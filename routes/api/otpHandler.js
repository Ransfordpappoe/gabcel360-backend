const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authController");

router.post("/generate-otp", authController.getOTPnotification);
module.exports = router;
