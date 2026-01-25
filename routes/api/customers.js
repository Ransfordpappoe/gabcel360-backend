const express = require("express");
const router = express.Router();

router.use("/add-new-customers", require("./addNewCustomer"));
module.exports = router;
