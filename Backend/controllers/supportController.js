const SupportQuery = require("../models/SupportQuery");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Student submits a support query
exports.createQuery = async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "Subject and message are required." });
        }

        const query = await SupportQuery.create({
            student: req.user._id,
            subject,
            message
        });

        // Notify all admins and instructors
        const recipients = await User.find({
            role: { $in: ["admin", "instructor"] },
            isActive: true
        }).select("_id");

        const notifications = recipients.map(r => ({
            recipient: r._id,
            sender: req.user._id,
            type: "SUPPORT_QUERY",
            title: "New Support Query",
            message: `${req.user.name}: ${subject}`,
            relatedId: query._id
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({ success: true, message: "Query submitted successfully.", query });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin/Instructor gets all queries
exports.getQueries = async (req, res) => {
    try {
        const queries = await SupportQuery.find()
            .populate("student", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, queries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin/Instructor resolves a query
exports.resolveQuery = async (req, res) => {
    try {
        const query = await SupportQuery.findByIdAndUpdate(
            req.params.id,
            { status: "resolved" },
            { new: true }
        );

        if (!query) return res.status(404).json({ success: false, message: "Query not found." });

        res.status(200).json({ success: true, query });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
