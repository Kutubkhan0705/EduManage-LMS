
const express = require("express");
const router = express.Router();

const {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissions,
    gradeSubmission,
} = require("../controllers/assignmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Admin and instructor
router.post("/", authorize("admin", "instructor"), createAssignment);
router.get("/", getAssignments);

router.get("/:id/submissions", authorize("admin", "instructor"), getSubmissions);
router.patch(
    "/submissions/:submissionId/grade",
    authorize("admin", "instructor"),
    gradeSubmission
);

// Student submission
router.post("/:id/submit", authorize("student"), submitAssignment);

// Assignment details and management
router.get("/:id", getAssignmentById);
router.put("/:id", authorize("admin", "instructor"), updateAssignment);
router.delete("/:id", authorize("admin", "instructor"), deleteAssignment);

module.exports = router;