const express = require("express");
const router = express.Router();

router.use("/admin-account", require("./adminAccount"));
router.use("/worker-account", require("./workerAccount"));
module.exports = router;
