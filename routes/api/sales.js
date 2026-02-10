const express = require("express");
const router = express.Router();

router.use("/single-sale", require("./addSingleSale"));
router.use("/multiple-sale", require("./addMultipleSales"));
router.use("/delete-sale", require("./deleteSales"));
router.use("/delete-multiple-sales", require("./deleteMultipleSales"));
module.exports = router;
