const mongoose = require('mongoose');
// models/Booking.js
// models/Booking.js
const BookingSchema = new mongoose.Schema({
  userId:           { type: String, required: true },
  userName:         { type: String, required: true },
  nutritionistId:   { type: String, required: true },
  nutritionistName: { type: String, default: "Nutritionist" }, // ✅ زيد
  date:             { type: String, required: true },
  time:             { type: String, required: true },
  status:           { type: String, default: "pending" },
  zoomLink:         { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);