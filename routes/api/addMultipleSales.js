const express = require("express");
const router = express.Router();
const salesController = require("../../controllers/salesController");

router.post("/multple-sale-handler", salesController.addMultipleSales);
module.exports = router;
