
const express = require("express");
const router = express.Router();

const {
    getDashboardStats,
    getPopularCourses,
    getEnrollmentStats
} = require("../controllers/dashboardController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Dashboard statistics
router.get("/", protect, getDashboardStats);

// Popular courses - Admin only
router.get(
    "/popular-courses",
    protect,
    authorize("admin"),
    getPopularCourses
);

// Monthly enrollment statistics - Admin only
router.get(
    "/enrollments",
    protect,
    authorize("admin"),
    getEnrollmentStats
);

module.exports = router;