const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Item = require("./models/Dish");
const Cart = require("./models/Cart");
const Order = require("./models/Order");
const jwt = require("jsonwebtoken");
const SECRET = "homechefsecret"; // later move to .env

const app = express();

// Middleware
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/homechef")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


// 🔹 Detect role from email
const getRole = (email) => {
  if (email.endsWith("@chef")) return "chef";
  if (email.endsWith("@adm")) return "admin";
  return "customer";
};

app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});
// 🔹 SIGNUP ROUTE
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role
    const role = getRole(email);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      location,
      role
    });

    await user.save();

    // 🔥 CREATE TOKEN (same as login)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );

    // 🔥 SEND TOKEN ALSO
    res.json({
      message: "User registered",
      role,
      token
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});
// 🔹 LOGIN ROUTE
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect password" });
    }

    // ✅ CREATE TOKEN
    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

app.get("/api/profile", verifyToken, (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user
  });
});

app.get("/api/profile-data", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error loading profile" });
  }
});

app.put("/api/profile-data", verifyToken, async (req, res) => {
  try {
    const { name, location, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, location, phone, address },
      { new: true }
    ).select("-password");

    res.json(user);

  } catch (err) {
    res.status(500).json({ msg: "Error updating profile" });
  }
});

app.post("/api/dish", verifyToken, async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      chefId: req.user.id
    });

    await item.save();

    res.json({ message: "Item added successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error adding item" });
  }
});

app.get("/api/my-items", verifyToken, async (req, res) => {
  const items = await Item.find({ chefId: req.user.id });
  res.json(items);
});

app.delete("/api/dish/:id", verifyToken, async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  // 🔥 check ownership
  if (item.chefId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await Item.findByIdAndDelete(req.params.id);

  res.json({ message: "Deleted successfully" });
});

app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find();

    const users = await User.find();

    const itemsWithChef = items.map(item => {
      const chef = users.find(
        u => u._id.toString() === item.chefId
      );

      return {
        ...item._doc,

        chefName: chef ? chef.name : "Unknown Chef",

        chefRating: chef?.rating || 0
      };
    });

    res.json(itemsWithChef);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Error fetching items"
    });
  }
});

app.post("/api/cart/add", verifyToken, async (req, res) => {
  const { item } = req.body;
  const userId = req.user.id;
  const type = item.type;

  let cart = await Cart.findOne({ userId, type });

  // 🆕 create cart if not exists
  if (!cart) {
    cart = new Cart({
      userId,
      type,
      chefId: type !== "ready" ? item.chefId : null,
      items: []
    });
  }

  // 🔒 chef restriction
  if (type !== "ready" && cart.chefId && cart.chefId !== item.chefId) {
    // clear old cart
    cart.items = [];
    cart.chefId = item.chefId;
  }

  const existing = cart.items.find(i => i.itemId === item._id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push({
      itemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  }

  await cart.save();

  res.json({ message: "Added to cart" });
});

app.get("/api/cart/:type", verifyToken, async (req, res) => {
  const cart = await Cart.findOne({
    userId: req.user.id,
    type: req.params.type
  });

  res.json(cart || { items: [] });
});

app.post("/api/cart/remove", verifyToken, async (req, res) => {
  const { type, itemId } = req.body;

  const cart = await Cart.findOne({
    userId: req.user.id,
    type
  });

  if (!cart) return res.json({});

  cart.items = cart.items.filter(i => i.itemId !== itemId);

  await cart.save();

  res.json({ message: "Removed" });
});

app.post("/api/cart/clear", verifyToken, async (req, res) => {
  const { type } = req.body;

  await Cart.findOneAndDelete({
    userId: req.user.id,
    type
  });

  res.json({ message: "Cleared" });
});

app.post("/api/place-order/:type", verifyToken, async (req, res) => {
  try {
    const type = req.params.type;

    const cart = await Cart.findOne({
      userId: req.user.id,
      type
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        msg: "Cart empty"
      });
    }

    const user = await User.findById(req.user.id);

    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = new Order({
      customerId: req.user.id,
      customerName: user.name,

      chefId: cart.chefId || "multiple",
      chefName: "Chef",

      type,
      items: cart.items,
      total,
      status: "pending"
    });

    await order.save();

    // clear cart after placing order
    await Cart.deleteOne({
      userId: req.user.id,
      type
    });

    res.json({
      msg: "Order placed successfully"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: "Error placing order"
    });
  }
});

app.get("/api/chef/orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({
      chefId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ msg: "Error fetching orders" });
  }
});

app.put("/api/order-status/:id", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    await Order.findByIdAndUpdate(req.params.id, {
      status
    });

    res.json({ msg: "Updated" });

  } catch (err) {
    res.status(500).json({ msg: "Error updating order" });
  }
});

app.get("/api/customer/orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({
      customerId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ msg: "Error fetching orders" });
  }
});

app.put("/api/order-delivered/:id", verifyToken, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(
      req.params.id,
      { status: "completed" }
    );

    res.json({ msg: "Delivered" });

  } catch (err) {
    res.status(500).json({ msg: "Error" });
  }
});

app.put("/api/rate-order/:id", verifyToken, async (req, res) => {
  try {
    const { stars } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "No order" });
    }

    if (order.rated) {
      return res.json({ msg: "Already rated" });
    }

    const chef = await User.findById(order.chefId);

    const total =
      chef.rating * chef.ratingCount + stars;

    chef.ratingCount += 1;
    chef.rating = total / chef.ratingCount;

    await chef.save();

    order.rated = true;
    await order.save();

    res.json({ msg: "Rated" });

  } catch (err) {
    res.status(500).json({ msg: "Error rating" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});