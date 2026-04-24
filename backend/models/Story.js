const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    name: String,
    content: String,
    result: String,

    status: {
        type: String,
        enum: ["pending", "approved"],
        default: "pending"
    }

}, { timestamps: true });

module.exports = mongoose.model("Story", storySchema);