const express = require("express");
const router = express.Router();

router.use("/upload", require("./addNewProduct"));
module.exports = router;
