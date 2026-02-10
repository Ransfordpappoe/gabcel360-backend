const express = require("express");
const router = express.Router();
const salesController = require("../../controllers/salesController");

router.post(
  "/deleteMultipleSales-handler",
  salesController.deleteMultipleSales,
);
module.exports = router;
