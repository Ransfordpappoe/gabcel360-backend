const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authController");

router.post("/admin-handler", authController.handleAdminLogin);
module.exports = router;
