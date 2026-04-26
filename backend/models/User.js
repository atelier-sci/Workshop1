const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    weight: {
      type: Number,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "nutritionist"],
      default: "user",
    },

    // ✅ زيدهم هنا
    healthStatus: {
      type: String,
      default: "",
    },
    goal: {
      type: String,
      enum: ["lose_weight", "gain_weight", "maintain_weight", "build_muscle", "improve_fitness", "eat_healthier", ""],
      default: "",
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);