const express = require("express");
const router = express.Router();
const salesController = require("../../controllers/salesController");

router.post("/shipping-handler", salesController.handleShippedItems);
module.exports = router;
