const express = require("express");
const router = express.Router();

router.use("/add-payment", require("./addPayment"));

module.exports = router;
