const express = require("express");

const { getData, doAnalytics } = require("../controllers/analyticController");

const router = express.Router();

router.post("/getData", getData);
router.post("/doAnalytics", doAnalytics);

module.exports = router;