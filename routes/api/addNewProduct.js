const express = require("express");
const router = express.Router();
const prodController = require("../../controllers/productController");

router.post("/upload-handler", prodController.addMultipleProducts);
module.exports = router;
