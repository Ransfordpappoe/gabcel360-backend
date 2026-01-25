const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authController");

router.post("/worker-handler", authController.handleWorkerLogin);
module.exports = router;
