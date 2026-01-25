const express = require("express");
const router = express.Router();
const customersController = require("../../controllers/customersController");

router.post("/add-new-handler", customersController.addNewCustomer);
module.exports = router;
