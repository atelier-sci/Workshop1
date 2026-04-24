const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "nutritionist"],
      required: true,
    },
    category: {
      type: String,
      enum: ["nutrition", "recipes", "fitness", "wellness"],
      default: "nutrition",
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/800x400",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Blog", blogSchema);