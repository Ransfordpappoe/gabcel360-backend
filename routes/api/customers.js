const express = require("express");
const router = express.Router();

router.use("/add-new-customers", require("./addNewCustomer"));
router.use("/update-customers", require("./updateCustomer"));
module.exports = router;
