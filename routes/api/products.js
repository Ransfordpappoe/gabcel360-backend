const express = require("express");
const router = express.Router();

router.use("/upload", require("./addNewProduct"));
router.use("/manage-product", require("./manageProd"));
module.exports = router;
