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

    // ❌ check if slot already taken
    const exists = await Booking.findOne({
      nutritionistId,
      date,
      time
    });

    if (exists) {
      return res.status(400).json({
        message: "This time slot is already booked"
      });
    }

    const booking = new Booking({
      userId,
      nutritionistId,
      date,
      time
    });

    await booking.save();

    res.json({ message: "Booking confirmed" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get("/api/bookings/:nutritionistId", async (req, res) => {
  try {
    const bookings = await Booking.find({
      nutritionistId: req.params.nutritionistId
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
// GET ALL USERS (ADMIN)
app.get("/api/admin/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// DELETE USER
app.delete("/api/admin/users/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

// APPROVE NUTRITIONIST
app.put("/api/admin/approve-nutritionist/:id", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    role: "nutritionist"
  });

  res.json({ message: "User approved as nutritionist" });
});

// ================= START =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});