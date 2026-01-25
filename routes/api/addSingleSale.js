const express = require("express");
const router = express.Router();
const salesController = require("../../controllers/salesController");

router.post("/single-sale-handler", salesController.addNewSingleSales);
module.exports = router;
