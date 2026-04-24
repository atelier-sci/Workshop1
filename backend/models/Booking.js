const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  nutritionistId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: String,
  time: String
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);