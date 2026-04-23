const express = require("express");
const router = express.Router();
const prodController = require("../../controllers/productController");

router.post("/delete-product", prodController.deleteProduct);
router.post("/edit-product", prodController.editProduct);
module.exports = router;
