const mongoose = require("mongoose");

const supportQuerySchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        subject: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ["open", "resolved"],
            default: "open"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("SupportQuery", supportQuerySchema);
