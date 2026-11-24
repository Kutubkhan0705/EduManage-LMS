
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    videoUrl: {
        type: String,
        default: ""
    },
    duration: {
        type: Number,
        default: 0
    }
});

// Student Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },

    // Store completed lesson IDs for each student
    completedLessons: [{
        type: mongoose.Schema.Types.ObjectId
    }]
});

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        level: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner"
        },
        thumbnail: {
            type: String,
            default: ""
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        lessons: [lessonSchema],

        enrolledStudents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        // Store student enrollment and progress
        enrollments: [enrollmentSchema],

        isPublished: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
