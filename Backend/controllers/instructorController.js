
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get all instructors
exports.getInstructors = async (req, res) => {
    try {
        const instructors = await User.find({ role: "instructor" })
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: instructors.length,
            instructors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Create instructor
exports.createInstructor = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const instructor = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "instructor",
        });

        res.status(201).json({
            success: true,
            message: "Instructor created successfully",
            instructor: {
                _id: instructor._id,
                name: instructor.name,
                email: instructor.email,
                role: instructor.role,
                isActive: instructor.isActive,
                createdAt: instructor.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Activate / Deactivate instructor
exports.updateInstructorStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Valid isActive value is required",
            });
        }

        const instructor = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: "instructor",
            },
            { isActive },
            { new: true }
        ).select("-password");

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Instructor status updated",
            instructor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
