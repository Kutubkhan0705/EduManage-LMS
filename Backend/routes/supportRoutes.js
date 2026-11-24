const express = require("express");
const router = express.Router();
const { createQuery, getQueries, resolveQuery } = require("../controllers/supportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("student"), createQuery);
router.get("/", protect, authorize("admin", "instructor"), getQueries);
router.patch("/:id/resolve", protect, authorize("admin", "instructor"), resolveQuery);

module.exports = router;
