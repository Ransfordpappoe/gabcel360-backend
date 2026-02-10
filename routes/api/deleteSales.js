const express = require("express");
const router = express.Router();
const salesController = require("../../controllers/salesController");

router.post("/deleteSales-handler", salesController.deleteSales);
module.exports = router;
