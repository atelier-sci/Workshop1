// models/Plan.js
const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
  userId:         { type: String, required: true },
  nutritionistId: { type: String, required: true }, // ✅ String مش ObjectId
  title:          { type: String, required: true },
  description:    { type: String, default: "" },
  price:          { type: String, default: "" },
  status:         { type: String, default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Plan", PlanSchema);