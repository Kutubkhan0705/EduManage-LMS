
const Course = require("../models/Course");
const Activity = require("../models/Activity");

// Save activity without interrupting the main operation
const saveActivity = async (
    user,
    action,
    message,
    relatedId = null,
    relatedModel = null
) => {
    try {
        await Activity.create({
            user,
            action,
            message,
            relatedId,
            relatedModel
        });
    } catch (error) {
        console.error("Activity save error:", error.message);
    }
};

// Create course
exports.createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            level,
            thumbnail,
            lessons,
            isPublished
        } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: "Title, description and category are required"
            });
        }

        const course = await Course.create({
            title,
            description,
            category,
            level,
            thumbnail,
            lessons: lessons || [],
            isPublished: isPublished === true,
            instructor: req.user._id
        });

        // Save course creation activity
        await saveActivity(
            req.user._id,
            "COURSE_CREATED",
            `${req.user.name} created course ${course.title}`,
            course._id,
            "Course"
        );

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all courses
exports.getCourses = async (req, res) => {
    try {
        const mongoose = require("mongoose");
        let filter = {};

        if (req.user.role === "admin") {
            filter = {};
        } else if (req.user.role === "instructor") {
            // Instructor sees all their own courses + other published courses
            filter = {
                $or: [
                    { instructor: new mongoose.Types.ObjectId(req.user._id) },
                    { isPublished: true }
                ]
            };
        } else {
            // Students only see published courses
            filter = { isPublished: true };
        }

        const courses = await Course.find(filter)
            .populate("instructor", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get logged-in instructor's courses
exports.getMyCourses = async (req, res) => {
    try {
        const filter =
            req.user.role === "admin"
                ? {}
                : { instructor: req.user._id };

        const courses = await Course.find(filter)
            .populate("instructor", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single course
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate("instructor", "name email");

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const isOwner =
            course.instructor._id.toString() === req.user._id.toString();

        const canViewDraft =
            req.user.role === "admin" ||
            (req.user.role === "instructor" && isOwner);

        if (!course.isPublished && !canViewDraft) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Invalid course ID or server error"
        });
    }
};

// Update course
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const isOwner =
            course.instructor.toString() === req.user._id.toString();

        if (req.user.role !== "admin" && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You cannot update this course"
            });
        }

        const allowedFields = [
            "title",
            "description",
            "category",
            "level",
            "thumbnail",
            "lessons",
            "isPublished"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete course
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const isOwner =
            course.instructor.toString() === req.user._id.toString();

        if (req.user.role !== "admin" && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete this course"
            });
        }

        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Student enrollment
exports.enrollCourse = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can enroll in courses"
            });
        }

        const course = await Course.findOne({
            _id: req.params.id,
            isPublished: true
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Published course not found"
            });
        }

        const alreadyEnrolled = course.enrolledStudents.some(
            (studentId) =>
                studentId.toString() === req.user._id.toString()
        );

        if (alreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: "You are already enrolled in this course"
            });
        }

        // Save student ID in existing array
        course.enrolledStudents.push(req.user._id);

        // Save enrollment date and student ID
        course.enrollments.push({
            student: req.user._id,
            enrolledAt: new Date()
        });

        await course.save();

        // Save course enrollment activity
        await saveActivity(
            req.user._id,
            "COURSE_ENROLLED",
            `${req.user.name} enrolled in ${course.title}`,
            course._id,
            "Course"
        );

        res.status(200).json({
            success: true,
            message: "Successfully enrolled in course"
        });

    } catch (error) {
        console.error("Course Enrollment Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Student's enrolled courses
exports.getEnrolledCourses = async (req, res) => {
    try {
        const courses = await Course.find({
            enrolledStudents: req.user._id
        }).populate("instructor", "name email");

        res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.markLessonComplete = async (req, res) => {
    try {
        const { id, lessonId } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found."
            });
        }

        // Check whether student is enrolled
        const enrollment = course.enrollments.find(
            (item) =>
                item.student.toString() === req.user._id.toString()
        );

        if (!enrollment) {
            return res.status(403).json({
                message: "You are not enrolled in this course."
            });
        }

        // Check whether lesson exists
        const lessonExists = course.lessons.some(
            (lesson) => lesson._id.toString() === lessonId
        );

        if (!lessonExists) {
            return res.status(404).json({
                message: "Lesson not found."
            });
        }

        const alreadyCompleted = enrollment.completedLessons.some(
            (completedId) => completedId.toString() === lessonId
        );

        if (alreadyCompleted) {
            enrollment.completedLessons =
                enrollment.completedLessons.filter(
                    (completedId) =>
                        completedId.toString() !== lessonId
                );
        } else {
            enrollment.completedLessons.push(lessonId);
        }

        await course.save();

        const totalLessons = course.lessons.length;
        const completedCount = enrollment.completedLessons.length;

        const progress = totalLessons === 0
            ? 0
            : Math.round((completedCount / totalLessons) * 100);

        res.status(200).json({
            message: alreadyCompleted
                ? "Lesson marked as incomplete."
                : "Lesson completed successfully.",
            completedLessons: enrollment.completedLessons,
            completedCount,
            totalLessons,
            progress
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
