const express = require("express");
const { getDailyLogins } = require("../controllers/UserLogsController");
const { authenticateJWT } = require("../config/autorisation");

const router = express.Router();

router.get("/getDailyLogins",authenticateJWT, getDailyLogins);

module.exports = router;