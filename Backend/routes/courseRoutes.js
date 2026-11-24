
const express = require("express");
const router = express.Router();

const {
    createCourse,
    getCourses,
    getMyCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    enrollCourse,
    getEnrolledCourses,
    markLessonComplete
} = require("../controllers/courseController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

// All course routes require login
router.use(protect);

// Specific routes before /:id
router.get("/my-courses", authorize("admin", "instructor"), getMyCourses);
router.get("/enrolled", authorize("student"), getEnrolledCourses);

// Course listing
router.get("/", getCourses);

// Create course: admin or instructor
router.post(
    "/",
    authorize("admin", "instructor"),
    createCourse
);

// Enroll: student only
router.post(
    "/:id/enroll",
    authorize("student"),
    enrollCourse
);
// Mark lesson complete or incomplete: student only
router.post(
    "/:id/lessons/:lessonId/complete",
    authorize("student"),
    markLessonComplete
);

// Single course
router.get("/:id", getCourseById);

// Update and delete
router.put(
    "/:id",
    authorize("admin", "instructor"),
    updateCourse
);

router.delete(
    "/:id",
    authorize("admin", "instructor"),
    deleteCourse
);

module.exports = router;
