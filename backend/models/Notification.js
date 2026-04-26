// في أعلى server.js بعد الـ models
const Notification = mongoose.model("Notification", new mongoose.Schema({
  userId:  { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, default: "info" },
  read:    { type: Boolean, default: false }
}, { timestamps: true }));