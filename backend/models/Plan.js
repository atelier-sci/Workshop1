const mongoose = require("mongoose");
const planSchema = new mongoose.Schema({
  nutritionistId: String,
  nutritionistName: String,

  userId: String,
  userName: String,

  title: String,
  description: String,

  status: { type: String, default: "active" }
});

module.exports = mongoose.model("Plan", planSchema);