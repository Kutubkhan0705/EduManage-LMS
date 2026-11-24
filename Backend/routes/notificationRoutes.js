const express = require("express");
const router = express.Router();
const { getNotifications, markRead, markAllRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markRead);
router.patch("/mark-all-read", protect, markAllRead);

module.exports = router;
