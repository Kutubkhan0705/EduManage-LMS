
const Course = require("../models/Course");
const User = require("../models/User");

// Get Analytics Overview
const getAnalyticsOverview = async (req, res) => {
    try {
        const isAdmin = req.user.role === "admin";

        // Instructor can only see their own courses
        const courseFilter = isAdmin
            ? {}
            : { instructor: req.user._id };

        // Fetch courses
        const courses = await Course.find(courseFilter)
            .select("title category lessons enrollments enrolledStudents isPublished createdAt")
            .lean();

        // Course statistics
        const totalCourses = courses.length;

        const publishedCourses = courses.filter(
            course => course.isPublished
        ).length;

        const draftCourses = totalCourses - publishedCourses;

        // Enrollment statistics
        const totalEnrollments = courses.reduce(
            (total, course) =>
                total + (course.enrollments?.length || 0),
            0
        );

        // Unique students enrolled in these courses
        const studentIds = new Set();

        courses.forEach(course => {
            (course.enrollments || []).forEach(enrollment => {
                if (enrollment.student) {
                    studentIds.add(enrollment.student.toString());
                }
            });

            // Support courses that have enrolledStudents
            // but no enrollment records
            if (!course.enrollments?.length) {
                (course.enrolledStudents || []).forEach(student => {
                    studentIds.add(student.toString());
                });
            }
        });

        const totalStudents = isAdmin
            ? await User.countDocuments({ role: "student" })
            : studentIds.size;

        // User statistics (admin only)
        let totalInstructors = 0;
        let activeUsers = 0;
        let inactiveUsers = 0;

        if (isAdmin) {
            totalInstructors = await User.countDocuments({
                role: "instructor"
            });

            activeUsers = await User.countDocuments({
                isActive: true
            });

            inactiveUsers = await User.countDocuments({
                isActive: false
            });
        }

        // Monthly enrollment statistics (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyData = await Course.aggregate([
            { $match: courseFilter },
            { $unwind: "$enrollments" },
            {
                $match: {
                    "enrollments.enrolledAt": {
                        $gte: sixMonthsAgo
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: {
                            $year: "$enrollments.enrolledAt"
                        },
                        month: {
                            $month: "$enrollments.enrolledAt"
                        }
                    },
                    enrollments: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Fill months with zero enrollments
        const monthlyEnrollments = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - i);

            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const found = monthlyData.find(
                item =>
                    item._id.year === year &&
                    item._id.month === month
            );

            monthlyEnrollments.push({
                month: date.toLocaleString("en-US", {
                    month: "short"
                }),
                enrollments: found ? found.enrollments : 0
            });
        }

        // Course-wise performance
        const coursePerformance = courses
            .map(course => ({
                title: course.title,
                category: course.category,
                enrollments: course.enrollments?.length || 0,
                lessons: course.lessons?.length || 0,
                published: course.isPublished
            }))
            .sort((a, b) => b.enrollments - a.enrollments)
            .slice(0, 5);

        // Overall lesson completion
        let completedLessons = 0;
        let possibleLessons = 0;

        courses.forEach(course => {
            const lessonCount = course.lessons?.length || 0;

            (course.enrollments || []).forEach(enrollment => {
                completedLessons +=
                    enrollment.completedLessons?.length || 0;

                possibleLessons += lessonCount;
            });
        });

        const completionRate = possibleLessons > 0
            ? Math.round(
                (completedLessons / possibleLessons) * 100
            )
            : 0;

        return res.status(200).json({
            success: true,
            analytics: {
                totalCourses,
                publishedCourses,
                draftCourses,
                totalEnrollments,
                totalStudents,
                totalInstructors,
                activeUsers,
                inactiveUsers,
                completedLessons,
                completionRate,
                monthlyEnrollments,
                coursePerformance
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
            error: error.message
        });
    }
};

module.exports = { getAnalyticsOverview };
