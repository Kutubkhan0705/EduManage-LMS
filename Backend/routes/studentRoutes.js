
const express = require("express");
const router = express.Router();

const {
    getStudents,
    getStudentById,
    updateStudentStatus
} = require("../controllers/studentController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

// Only admin can manage students
router.use(protect, authorize("admin"));

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.patch("/:id/status", updateStudentStatus);

module.exports = router;
