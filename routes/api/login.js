const express = require("express");
const router = express.Router();

router.use("/admin-login", require("./loginAsAdmin"));
router.use("/worker-login", require("./loginAsWorker"));
router.use("/otp", require("./otpHandler"));
module.exports = router;
