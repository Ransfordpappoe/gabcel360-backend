const express = require("express");
const router = express.Router();

router.use("/single-sale", require("./addSingleSale"));
router.use("/multiple-sale", require("./addMultipleSales"));
module.exports = router;
