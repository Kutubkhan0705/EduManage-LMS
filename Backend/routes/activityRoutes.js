
const express = require("express");
const router = express.Router();

const {
    getRecentActivities
} = require("../controllers/activityController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getRecentActivities);

module.exports = router;
