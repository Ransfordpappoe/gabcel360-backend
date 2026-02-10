const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/paymentsController");

router.post("/add-payment-handler", paymentController.addPayment);
module.exports = router;
