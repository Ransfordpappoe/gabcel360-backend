const express = require("express");
const router = express.Router();

router.use("/admin-login", require("./loginAsAdmin"));
router.use("/worker-login", require("./loginAsWorker"));
module.exports = router;
