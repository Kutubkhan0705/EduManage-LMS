
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Course = require("../models/Course");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");

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

// Check whether admin or instructor can manage this course
const canManageCourse = async (courseId, user) => {
    const course = await Course.findById(courseId);

    if (!course) return null;

    if (
        user.role === "admin" ||
        course.instructor.toString() === user._id.toString()
    ) {
        return course;
    }

    return null;
};

// Create assignment
exports.createAssignment = async (req, res) => {
    try {
        const {
            title,
            description,
            courseId,
            dueDate,
            totalMarks,
            isPublished,
        } = req.body;

        if (!title || !description || !courseId || !dueDate || !totalMarks) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields",
            });
        }

        if (Number(totalMarks) < 1) {
            return res.status(400).json({
                success: false,
                message: "Total marks must be at least 1",
            });
        }

        const parsedDueDate = new Date(dueDate);

        if (Number.isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid due date",
            });
        }

        const course = await canManageCourse(courseId, req.user);

        if (!course) {
            return res.status(403).json({
                success: false,
                message: "You cannot create assignments for this course",
            });
        }

        const assignment = await Assignment.create({
            title,
            description,
            course: courseId,
            instructor: req.user._id,
            dueDate: parsedDueDate,
            totalMarks,
            isPublished: isPublished ?? true,
        });

        res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            assignment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get assignments
exports.getAssignments = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === "instructor") {
            filter.instructor = req.user._id;
        }

        if (req.user.role === "student") {
            const enrolledCourses = await Course.find({
                enrolledStudents: req.user._id,
                isPublished: true,
            }).select("_id");

            filter.course = {
                $in: enrolledCourses.map((c) => c._id)
            };

            filter.isPublished = true;
        }

        if (req.query.courseId) {
            filter.course = req.query.courseId;
        }

        const assignments = await Assignment.find(filter)
            .populate("course", "title")
            .populate("instructor", "name email")
            .sort({ dueDate: 1 });

        let assignmentsWithSubmission = assignments;

        if (req.user.role === "student") {
            const assignmentIds = assignments.map((item) => item._id);

            const submissions = await Submission.find({
                student: req.user._id,
                assignment: { $in: assignmentIds }
            }).select(
                "assignment answer submittedAt marksObtained feedback status"
            );

            const submissionMap = new Map(
                submissions.map((submission) => [
                    submission.assignment.toString(),
                    submission
                ])
            );

            assignmentsWithSubmission = assignments.map((assignment) => {
                const assignmentData = assignment.toObject();

                assignmentData.mySubmission =
                    submissionMap.get(assignment._id.toString()) || null;

                return assignmentData;
            });
        }

        res.status(200).json({
            success: true,
            count: assignmentsWithSubmission.length,
            assignments: assignmentsWithSubmission,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get one assignment
exports.getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate("course", "title")
            .populate("instructor", "name");

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        if (
            req.user.role === "instructor" &&
            assignment.instructor._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (req.user.role === "student") {
            const course = await Course.findOne({
                _id: assignment.course._id,
                enrolledStudents: req.user._id,
                isPublished: true,
            });

            if (!course || !assignment.isPublished) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }
        }

        res.status(200).json({
            success: true,
            assignment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update assignment
exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        if (
            req.user.role !== "admin" &&
            assignment.instructor.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot update this assignment",
            });
        }

        const allowedFields = [
            "title",
            "description",
            "dueDate",
            "totalMarks",
            "isPublished",
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                assignment[field] = req.body[field];
            }
        });

        await assignment.save();

        res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            assignment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        if (
            req.user.role !== "admin" &&
            assignment.instructor.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete this assignment",
            });
        }

        await Submission.deleteMany({ assignment: assignment._id });
        await assignment.deleteOne();

        res.status(200).json({
            success: true,
            message: "Assignment deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Student submits assignment
exports.submitAssignment = async (req, res) => {
    try {
        const { answer } = req.body;

        if (!answer || !answer.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your answer",
            });
        }

        const assignment = await Assignment.findById(req.params.id);

        if (!assignment || !assignment.isPublished) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        const course = await Course.findOne({
            _id: assignment.course,
            enrolledStudents: req.user._id,
            isPublished: true,
        });

        if (!course) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this course",
            });
        }

        if (new Date() > assignment.dueDate) {
            return res.status(400).json({
                success: false,
                message: "Assignment deadline has passed",
            });
        }

        const existingSubmission = await Submission.findOne({
            assignment: assignment._id,
            student: req.user._id,
        });

        if (existingSubmission?.status === "Graded") {
            return res.status(400).json({
                success: false,
                message: "This assignment has already been graded",
            });
        }

        const submission = await Submission.findOneAndUpdate(
            {
                assignment: assignment._id,
                student: req.user._id,
            },
            {
                answer,
                submittedAt: new Date(),
                status: "Submitted",
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        // Save student submission activity
        await saveActivity(
            req.user._id,
            "ASSIGNMENT_SUBMITTED",
            `${req.user.name} submitted ${assignment.title}`,
            submission._id,
            "Submission"
        );

        // Notify the assignment instructor
        try {
            await Notification.create({
                recipient: assignment.instructor,
                sender: req.user._id,
                type: "ASSIGNMENT_SUBMITTED",
                title: "New Assignment Submission",
                message: `${req.user.name} submitted "${assignment.title}"`,
                relatedId: submission._id
            });
        } catch (e) {
            console.error("Notification error:", e.message);
        }

        res.status(200).json({
            success: true,
            message: "Assignment submitted successfully",
            submission,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Instructor views submissions
exports.getSubmissions = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        if (
            req.user.role !== "admin" &&
            assignment.instructor.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }

        const submissions = await Submission.find({
            assignment: assignment._id,
        })
            .populate("student", "name email")
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: submissions.length,
            submissions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Instructor grades a submission
exports.gradeSubmission = async (req, res) => {
    try {
        const { marksObtained, feedback } = req.body;

        const submission = await Submission.findById(req.params.submissionId)
            .populate("assignment");

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        const assignment = submission.assignment;

        if (
            req.user.role !== "admin" &&
            assignment.instructor.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }

        const marks = Number(marksObtained);

        if (
            !Number.isFinite(marks) ||
            marks < 0 ||
            marks > assignment.totalMarks
        ) {
            return res.status(400).json({
                success: false,
                message: `Marks must be between 0 and ${assignment.totalMarks}`,
            });
        }

        submission.marksObtained = marks;
        submission.feedback = feedback || "";
        submission.status = "Graded";

        await submission.save();

        // Save grading activity
        await saveActivity(
            req.user._id,
            "ASSIGNMENT_GRADED",
            `${req.user.name} graded ${assignment.title}`,
            submission._id,
            "Submission"
        );

        res.status(200).json({
            success: true,
            message: "Submission graded successfully",
            submission,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
