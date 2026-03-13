const express = require("express");
const router = express.Router();
const customersController = require("../../controllers/customersController");

router.post("/update-handler", customersController.updateCustomer);
module.exports = router;
