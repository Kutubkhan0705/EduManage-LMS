
const express = require("express");
const router = express.Router();

const {
    getInstructors,
    createInstructor,
    updateInstructorStatus,
} = require("../controllers/instructorController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Admin only routes
router.use(protect, authorize("admin"));

router.get("/", getInstructors);
router.post("/", createInstructor);
router.patch("/:id/status", updateInstructorStatus);

module.exports = router;
