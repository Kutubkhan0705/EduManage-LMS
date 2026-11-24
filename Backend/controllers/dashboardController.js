
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

// @desc Get dashboard statistics
// @route GET /api/dashboard
// @access Private
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;

        // ADMIN DASHBOARD
        if (role === "admin") {
            const [
                totalStudents,
                totalInstructors,
                totalCourses,
                courses
            ] = await Promise.all([
                User.countDocuments({ role: "student" }),
                User.countDocuments({ role: "instructor" }),
                Course.countDocuments(),
                Course.find().select("enrolledStudents")
            ]);

            const totalEnrollments = courses.reduce(
                (total, course) =>
                    total + (course.enrolledStudents?.length || 0),
                0
            );

            return res.status(200).json({
                success: true,
                stats: {
                    totalStudents,
                    totalInstructors,
                    totalCourses,
                    totalEnrollments
                }
            });
        }

        // INSTRUCTOR DASHBOARD
        if (role === "instructor") {
            const mongoose = require("mongoose");
            const instructorObjId = new mongoose.Types.ObjectId(userId);

            const courses = await Course.find({
                instructor: instructorObjId
            }).select("enrolledStudents");

            const courseIds = courses.map(c => c._id);

            const studentIds = new Set();
            courses.forEach(course => {
                (course.enrolledStudents || []).forEach(sid => {
                    studentIds.add(sid.toString());
                });
            });

            const assignmentIds = await Assignment.find({
                instructor: instructorObjId
            }).distinct("_id");

            const [totalAssignments, pendingReviews] = await Promise.all([
                Assignment.countDocuments({ instructor: instructorObjId }),
                Submission.countDocuments({
                    assignment: { $in: assignmentIds },
                    status: "Submitted"
                })
            ]);

            return res.status(200).json({
                success: true,
                stats: {
                    myCourses: courseIds.length,
                    myStudents: studentIds.size,
                    totalAssignments,
                    pendingReviews
                }
            });
        }

        // STUDENT DASHBOARD
        if (role === "student") {
            const enrolledCourses = await Course.find({
                enrolledStudents: userId
            }).select("_id");

            const courseIds = enrolledCourses.map(course => course._id);

            const assignments = await Assignment.find({
                course: { $in: courseIds },
                isPublished: true
            }).select("_id totalMarks");

            const assignmentIds = assignments.map(
                assignment => assignment._id
            );

            const submissions = await Submission.find({
                student: userId,
                assignment: { $in: assignmentIds }
            });

            const submittedIds = new Set(
                submissions.map(sub => sub.assignment.toString())
            );

            const pendingAssignments = assignments.filter(
                assignment => !submittedIds.has(assignment._id.toString())
            ).length;

            const gradedSubmissions = submissions.filter(
                sub => sub.status === "Graded" &&
                    sub.marksObtained !== null
            );

            const totalMarks = gradedSubmissions.reduce(
                (total, sub) => total + sub.marksObtained,
                0
            );

            const averageMarks = gradedSubmissions.length
                ? Number((totalMarks / gradedSubmissions.length).toFixed(2))
                : 0;

            return res.status(200).json({
                success: true,
                stats: {
                    enrolledCourses: enrolledCourses.length,
                    pendingAssignments,
                    completedAssignments: submissions.length,
                    averageMarks
                }
            });
        }

        return res.status(403).json({
            success: false,
            message: "Invalid user role"
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
};


// @desc Get top 3 popular courses
// @route GET /api/dashboard/popular-courses
// @access Private
exports.getPopularCourses = async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                $match: {
                    isPublished: true
                }
            },
            {
                $addFields: {
                    students: {
                        $size: {
                            $ifNull: ["$enrolledStudents", []]
                        }
                    }
                }
            },
            {
                $sort: {
                    students: -1
                }
            },
            {
                $limit: 3
            },
            {
                $lookup: {
                    from: "users",
                    localField: "instructor",
                    foreignField: "_id",
                    as: "instructor"
                }
            },
            {
                $unwind: {
                    path: "$instructor",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    title: 1,
                    category: 1,
                    thumbnail: 1,
                    students: 1,
                    instructor: "$instructor.name"
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });

    } catch (error) {
        console.error("Popular Courses Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// @desc Get monthly enrollment statistics
// @route GET /api/dashboard/enrollments
// @access Private
exports.getEnrollmentStats = async (req, res) => {
    try {
        const currentYear = Number(req.query.year) || new Date().getFullYear();

        const startDate = new Date(Date.UTC(currentYear, 0, 1));
        const endDate = new Date(Date.UTC(currentYear + 1, 0, 1));

        const enrollmentData = await Course.aggregate([
            {
                $unwind: "$enrollments"
            },
            {
                $match: {
                    "enrollments.enrolledAt": {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: {
                            $month: "$enrollments.enrolledAt"
                        }
                    },
                    total: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id.month": 1
                }
            }
        ]);

        const monthNames = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ];

        const monthlyEnrollments = monthNames.map((month, index) => {
            const found = enrollmentData.find(
                item => item._id.month === index + 1
            );

            return {
                month,
                enrollments: found ? found.total : 0
            };
        });

        res.status(200).json({
            success: true,
            year: currentYear,
            monthlyEnrollments
        });

    } catch (error) {
        console.error("Enrollment Stats Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

