const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= DB =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// ================= MODELS =================
const User = require("./models/User");
const Blog = require("./models/Blog");
const Story = require("./models/Story");
const Booking = require("./models/Booking");
const Plan = require("./models/Plan");
const NotificationSchema = new mongoose.Schema({
  userId:  { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, default: "info" },
  read:    { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);
// ================= AUTH =================

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password, weight, age, height } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email,
      password: hashed,
      weight,
      age,
      height,
      

    });
    

    await user.save();

    res.json({ message: "Registration successful" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user,
       role: user.role
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= BLOGS =================

// GET ALL
app.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// SEARCH
app.get("/api/blogs/search", async (req, res) => {
  try {
    const q = req.query.q;
    const blogs = await Blog.find({
      title: { $regex: q, $options: "i" },
    });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ONE BLOG
app.get("/api/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    res.json(blog);
  } catch (error) {
    res.status(404).json({ message: "Blog not found" });
  }
});


// ADD BLOG (admin)
app.post("/api/blogs", async (req, res) => {
  try {
    const { title, summary, content, author, role, category, image } = req.body;

    if (!["admin", "nutritionist"].includes(role)) {
      return res.status(403).json({
        message: "Only Admin and Nutritionist can add articles",
      });
    }

    const blog = new Blog({
      title,
      summary,
      content,
      author,
      role,
      category,
      image,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ================= FRONTEND =================
app.get("/Blog.html", (req, res) => {
  res.sendFile(path.join(__dirname, "Blog.html"));
});

app.get("/article.html", (req, res) => {
  res.sendFile(path.join(__dirname, "article.html"));
});

app.get("/HomePage.html", (req, res) => {
  res.sendFile(path.join(__dirname, "HomePage.html"));
});
app.get("/UserDashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "UserDashboard.html"));
});
// story
app.post("/api/stories", async (req, res) => {
    const { userId, name, content, result } = req.body;

    const story = new Story({
        userId,
        name,
        content,
        result,
        status: "pending" // مهم 🔥
    });

    await story.save();

    res.json({ message: "Story sent for review" });
});
app.get("/api/stories", async (req, res) => {
    const stories = await Story.find({ status: "approved" })
        .sort({ createdAt: -1 });

    res.json(stories);
});
app.get("/api/stories/pending", async (req, res) => {
    const stories = await Story.find({ status: "pending" });
    res.json(stories);
});
app.put("/api/stories/:id/approve", async (req, res) => {
    await Story.findByIdAndUpdate(req.params.id, {
        status: "approved"
    });

    res.json({ message: "Story approved" });
});
app.delete("/api/stories/:id", async (req, res) => {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});
app.post("/api/bookings", async (req, res) => {
  try {
    const { userId, nutritionistId, date, time } = req.body;

    // validate
    if (!userId || !nutritionistId || !date || !time) {
      return res.status(400).json({ message: "Missing data" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const nutritionist = await User.findById(nutritionistId);
    const nutritionistName = nutritionist ? nutritionist.fullName : "Your Nutritionist";

const cleanDate = date;
const cleanTime = time.trim();

const exists = await Booking.findOne({
  nutritionistId: nutritionistId.toString(),
  date: cleanDate,
  time: cleanTime
});

    if (exists) {
      return res.status(400).json({
        message: "This time slot is already booked"
      });
    }

    const booking = new Booking({
      userId:           userId.toString(),
      userName: user.fullName,
      nutritionistId:   nutritionistId.toString(),
      nutritionistName,
      date: cleanDate,
      time: cleanTime,
      status: "pending"
    });

    await booking.save();

    console.log("BOOKING SAVED:", booking);

    res.json({
      message: "Booking successful",
      booking
    });

  } catch (err) {
    console.log("ERROR BOOKING:", err);
    res.status(500).json({ message: err.message });
  }
});
// GET BOOKINGS FOR A SPECIFIC USER
app.get("/api/user/bookings/:id", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.id.toString() })
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get("/api/nutritionist/bookings/:id", async (req, res) => {
  try {
    const bookings = await Booking.find({
      nutritionistId: req.params.id
    }).sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

});
app.post("/api/create-admin", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const admin = new User({
      fullName,
      email,
      password: hashed,
      role: "admin"
    });

    await admin.save();

    res.json({ message: "Admin created" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get("/api/admin/nutritionists", async (req, res) => {
  try {
    const nutritionists = await User.find({ role: "nutritionist" });
    res.json(nutritionists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post("/api/admin/nutritionists", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const nutritionist = new User({
      fullName,
      email,
      password: hashed,
      role: "nutritionist"
    });

    await nutritionist.save();

    res.json({ message: "Nutritionist added" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.delete("/api/admin/nutritionists/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Nutritionist deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// APPROVE NUTRITIONIST
app.post("/api/admin/add-nutritionist", async (req, res) => {
  const { fullName, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    email,
    password: hashed,
    role: "nutritionist"
  });

  res.json(user);
});



app.put("/api/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    await booking.save();

    // ✅ notification تلقائي
    const message = status === "accepted"
      ? `✅ Your consultation on ${booking.date} at ${booking.time} has been accepted!`
      : `❌ Your consultation on ${booking.date} at ${booking.time} has been cancelled.`;

    await Notification.create({
      userId:  booking.userId.toString(),
      message,
      type: status === "accepted" ? "success" : "danger"
    });

    res.json({ message: "Status updated", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put("/api/bookings/:id/zoom", async (req, res) => {
  try {
    const { zoomLink } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.zoomLink = zoomLink;
    await booking.save();

    // ✅ إرسال notification تلقائي من الـ server
    await Notification.create({
      userId:  booking.userId.toString(),
      message: `🔗 Your nutritionist sent you a Zoom link for your session on ${booking.date} at ${booking.time}: ${zoomLink}`,
      type:    "info"
    });

    res.json({ message: "Zoom link updated", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

app.post("/api/plans", async (req, res) => {
  const plan = await Plan.create(req.body);
  res.json(plan);
});
app.get("/api/nutritionist/plans/:id", async (req, res) => {
  const plans = await Plan.find({
    nutritionistId: req.params.id
  });

  res.json(plans);
});
app.get("/api/user/plans/:id", async (req, res) => {
  const plans = await Plan.find({
    userId: req.params.id
  });

  res.json(plans);
});
app.put("/api/plans/:id", async (req, res) => {
  const updated = await Plan.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      status: "updated"
    },
    { new: true }
  );

  res.json(updated);
});
app.delete("/api/plans/:id", async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.json({ message: "Plan deleted" });
});



// GET ALL NUTRITIONISTS (باش يبانوا في choose nutritionist page)
app.get("/api/nutritionists", async (req, res) => {
  try {
    const nutritionists = await User.find({ role: "nutritionist" });
    res.json(nutritionists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ================= NOTIFICATIONS =================

// إرسال اشعار
app.post("/api/notifications", async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    const notif = await Notification.create({ userId, message, type });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// جيب اشعارات المستخدم
app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// علم كقروءة
app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET ALL BOOKINGS (ADMIN)
app.get("/api/admin/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE BOOKING (ADMIN)
app.delete("/api/admin/bookings/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// EDIT BLOG (ADMIN)
app.put("/api/blogs/:id", async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE BLOG (ADMIN)
app.delete("/api/blogs/:id", async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




// ================= START =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});