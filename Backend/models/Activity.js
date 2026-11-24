
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        action: {
            type: String,
            required: true,
            enum: [
                "REGISTERED",
                "COURSE_CREATED",
                "COURSE_ENROLLED",
                "ASSIGNMENT_CREATED",
                "ASSIGNMENT_SUBMITTED",
                "ASSIGNMENT_GRADED"
            ]
        },

        message: {
            type: String,
            required: true
        },

        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        relatedModel: {
            type: String,
            enum: ["Course", "Assignment", "Submission", null],
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Activity", activitySchema);
