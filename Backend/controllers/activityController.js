
const Activity = require("../models/Activity");

// Get recent activities
exports.getRecentActivities = async (req, res) => {
    try {
        const filter = {};

        // Instructor ko sirf apni activities dikhengi
        if (req.user.role === "instructor") {
            filter.user = req.user._id;
        }

        // Student ko sirf apni activities dikhengi
        if (req.user.role === "student") {
            filter.user = req.user._id;
        }

        const activities = await Activity.find(filter)
            .populate("user", "name role")
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            count: activities.length,
            activities
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
