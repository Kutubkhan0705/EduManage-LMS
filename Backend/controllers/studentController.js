
const User = require("../models/User");
const Course = require("../models/Course");

// Get all students
exports.getStudents = async (req, res) => {
    try {
        const { search = "" } = req.query;

        const students = await User.find({
            role: "student",
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        })
            .select("-password")
            .sort({ createdAt: -1 });

        // Count courses in which each student is enrolled
        const enrollmentCounts = await Course.aggregate([
            { $unwind: "$enrolledStudents" },
            {
                $group: {
                    _id: "$enrolledStudents",
                    totalCourses: { $sum: 1 }
                }
            }
        ]);

        const countMap = new Map(
            enrollmentCounts.map((item) => [
                item._id.toString(),
                item.totalCourses
            ])
        );

        const result = students.map((student) => ({
            ...student.toObject(),
            enrolledCourses: countMap.get(student._id.toString()) || 0
        }));

        res.status(200).json({
            success: true,
            count: result.length,
            students: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get one student
exports.getStudentById = async (req, res) => {
    try {
        const student = await User.findOne({
            _id: req.params.id,
            role: "student"
        }).select("-password");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const enrolledCourses = await Course.find({
            enrolledStudents: student._id
        }).select("title category level thumbnail");

        res.status(200).json({
            success: true,
            student,
            enrolledCourses
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid student ID"
        });
    }
};

// Activate or deactivate student
exports.updateStudentStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false"
            });
        }

        const student = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: "student"
            },
            { isActive },
            { new: true, runValidators: true }
        ).select("-password");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `Student ${isActive ? "activated" : "deactivated"} successfully`,
            student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
