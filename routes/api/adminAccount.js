const express = require("express");
const router = express.Router();
const registerController = require("../../controllers/registerController");

router.post("/admin-handler", registerController.handleCreateAdminAccount);
module.exports = router;
