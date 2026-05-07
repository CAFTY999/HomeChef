const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Item = require("./models/Dish");
const Cart = require("./models/Cart");
const Order = require("./models/Order");
const jwt = require("jsonwebtoken");
const SECRET = "homechefsecret"; // later move to .env
const Subscription = require("./models/Subscription");
const Transaction = require("./models/Transaction");
const OTP = require("./models/OTP");
const nodemailer = require("nodemailer");

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
  .then(async () => {
    console.log("MongoDB Connected");
    // Clean up old unique index if it exists to support new multi-role indexing
    try {
      const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
      if (collections.length > 0) {
        await mongoose.connection.db.collection('users').dropIndex('email_1');
        console.log("Old unique email index dropped successfully");
      }
    } catch (err) {
      // Index might already be gone or named differently, ignore errors
      console.log("Note: Old email index cleanup skipped (may already be removed)");
    }
  })
  .catch(err => console.log(err));


// 🔹 Detect role from email
const getRole = (email) => {
  // We now restrict all to @gmail.com, so we rely on bodyRole or default to customer
  return "customer";
};

// 🔹 NODEMAILER SETUP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bhavikarisetty@gmail.com",
    pass: "vwbl rgjb hpvi egtc" 
  }
});

// 🔹 PASSWORD VALIDATION
const validatePassword = (password) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return regex.test(password);
};

// 🔹 SEND OTP ROUTE
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail.trim().toLowerCase();

    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ error: "Only @gmail.com emails are allowed" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to DB
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    // Send Email
    const mailOptions = {
      from: "HomeChef <your-email@gmail.com>",
      to: email,
      subject: "Your HomeChef Verification Code",
      text: `Your OTP for HomeChef signup is: ${otp}. It expires in 5 minutes.`
    };

    // Note: In real world, use await transporter.sendMail(mailOptions);
    // For now, I'll log it and the user can set up credentials later
    console.log(`OTP for ${email}: ${otp}`);

    // Attempting to send (will fail if credentials are not set)
    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "OTP sent to your email" });
    } catch (mailErr) {
      console.log("Mail send failed, but OTP logged for dev:", otp);
      res.json({ message: "OTP generated (Check console for dev)", devOtp: otp });
    }

  } catch (err) {
    res.status(500).json({ error: "Error sending OTP" });
  }
});

// 🔹 FORGOT PASSWORD OTP ROUTE
app.post("/api/forgot-password-otp", async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = rawEmail.trim().toLowerCase();

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save to DB
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    // 4. Send Email
    const mailOptions = {
      from: "HomeChef Support <your-email@gmail.com>",
      to: email,
      subject: "Password Reset Code - HomeChef",
      text: `Your password reset code is: ${otp}. If you didn't request this, please ignore this email.`
    };

    console.log(`Reset OTP for ${email}: ${otp}`);

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Reset code sent to your email" });
    } catch (mailErr) {
      res.json({ message: "Code generated (Check console for dev)", devOtp: otp });
    }
  } catch (err) {
    res.status(500).json({ error: "Error sending reset code" });
  }
});

// 🔹 RESET PASSWORD FINAL ROUTE
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email: rawEmail, otp: rawOtp, newPassword } = req.body;
    const email = rawEmail.trim().toLowerCase();
    const otp = rawOtp.trim();

    // 1. Verify OTP
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    // 2. Validate Password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long and contain letters, numbers, and special characters."
      });
    }

    // 3. Update all accounts with this email (if multi-role support is enabled)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await User.updateMany({ email }, { password: hashedPassword });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // 4. Cleanup
    await OTP.deleteOne({ email });

    res.json({ message: "Password updated successfully! You can now login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error resetting password" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});
// 🔹 SIGNUP ROUTE
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email: rawEmail, password, location, coordinates, role: bodyRole, otp: rawOtp } = req.body;
    const email = rawEmail.trim().toLowerCase();
    const otp = rawOtp.trim();

    console.log(`Verifying signup for: ${email} with OTP: ${otp}`);

    // 1. Enforce Gmail
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ error: "Only @gmail.com emails are allowed" });
    }

    // 2. Validate Password
    if (!validatePassword(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long and contain letters, numbers, and special characters."
      });
    }

    // 3. Verify OTP
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      console.log(`OTP check failed for ${email}. Record found?`, !!(await OTP.findOne({ email })));
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Get role (prioritize bodyRole from the selector)
    const role = bodyRole || "customer";

    // 3. Check if email + role already exists
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return res.status(400).json({ error: `Account already exists for this email as a ${role}` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Assigning role: ${role} to user: ${email}`);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      location,
      coordinates,
      role
    });

    await user.save();

    // Delete OTP after successful signup
    await OTP.deleteOne({ email });

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
    const { email: rawEmail, password, role: bodyRole } = req.body;
    const email = rawEmail.trim().toLowerCase();

    // If role is provided, find that specific account, otherwise find any
    let user;
    if (bodyRole) {
      user = await User.findOne({ email, role: bodyRole });
    } else {
      user = await User.findOne({ email });
    }

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
        chefRating: chef?.rating || 0,
        chefBio: chef?.bio || "",
        chefSpeciality: chef?.speciality || ""
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
      chefId: item.chefId,
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

app.post("/api/cart/decrement", verifyToken, async (req, res) => {
  const { type, itemId } = req.body;

  const cart = await Cart.findOne({
    userId: req.user.id,
    type
  });

  if (!cart) return res.json({});

  const existing = cart.items.find(i => i.itemId === itemId);
  if (existing) {
    if (existing.quantity > 1) {
      existing.quantity -= 1;
    } else {
      cart.items = cart.items.filter(i => i.itemId !== itemId);
    }
    await cart.save();
  }

  res.json({ message: "Decremented" });
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
    const { deliveryLocation } = req.body;

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
    if (!user) return res.status(404).json({ msg: "User not found" });

    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 💰 CHECK WALLET BALANCE
    if (user.walletBalance < total) {
      return res.status(400).json({ msg: "Insufficient wallet balance. Please top up." });
    }

    let orderIds = [];
    let mainOrderId = null;

    if (type === "ready") {
      // 🍕 Group items by chefId for ready food
      const itemsByChef = {};
      cart.items.forEach(item => {
        // Fallback to cart.chefId if item.chefId is missing
        const cId = item.chefId || cart.chefId || "unknown";
        if (!itemsByChef[cId]) itemsByChef[cId] = [];
        itemsByChef[cId].push(item);
      });

      for (const cId in itemsByChef) {
        const chefItems = itemsByChef[cId];
        const chefTotal = chefItems.reduce((s, i) => s + i.price * i.quantity, 0);

        let chefName = "HomeChef Kitchen";
        if (cId !== "unknown" && mongoose.Types.ObjectId.isValid(cId)) {
          const chefUser = await User.findById(cId);
          if (chefUser) chefName = chefUser.name;
        }

        const order = new Order({
          customerId: req.user.id,
          customerName: user.name,
          chefId: cId,
          chefName: chefName,
          type,
          items: chefItems,
          total: chefTotal,
          status: "pending",
          deliveryLocation
        });

        await order.save();
        orderIds.push(order._id);
        if (!mainOrderId) mainOrderId = order._id;
      }
    } else {
      // 🍱 Single chef for Daily/Subscription
      let chefName = "HomeChef Kitchen";
      if (cart.chefId && mongoose.Types.ObjectId.isValid(cart.chefId)) {
        const chef = await User.findById(cart.chefId);
        if (chef) chefName = chef.name;
      }

      const order = new Order({
        customerId: req.user.id,
        customerName: user.name,
        chefId: cart.chefId,
        chefName: chefName,
        type,
        items: cart.items,
        total,
        status: "pending",
        deliveryLocation
      });

      await order.save();
      mainOrderId = order._id;
      orderIds.push(order._id);
    }

    // 💰 DEDUCT FROM WALLET
    user.walletBalance -= total;
    await user.save();

    // 📝 LOG TRANSACTION
    const trans = new Transaction({
      userId: req.user.id,
      amount: total,
      type: "debit",
      description: `Payment for ${type} order(s)`
    });
    await trans.save();

    // clear cart after placing order
    await Cart.deleteOne({
      userId: req.user.id,
      type
    });

    res.json({
      msg: "Order placed successfully",
      orderId: mainOrderId,
      orderIds
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

app.get("/api/order/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Not found" });

    // fetch chef to get coordinates
    const chef = await User.findById(order.chefId);

    res.json({
      order,
      chefLocation: chef ? chef.coordinates : null
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching order" });
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

// 🔹 DELIVERY PARTNER ROUTES
app.get("/api/delivery/orders", verifyToken, async (req, res) => {
  try {
    // Delivery partner can see orders that are "accepted" by chef (ready for pickup)
    // OR orders that are currently assigned to this delivery partner
    const orders = await Order.find({
      $or: [
        { status: "accepted" },
        { deliveryPartnerId: req.user.id }
      ]
    }).sort({ createdAt: -1 }).lean();

    const userIds = new Set();
    orders.forEach(o => {
      if (o.customerId) userIds.add(o.customerId);
      if (o.chefId) userIds.add(o.chefId);
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } });
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u);

    const enrichedOrders = orders.map(o => {
      const customer = userMap[o.customerId];
      const chef = userMap[o.chefId];
      return {
        ...o,
        customerAddress: customer ? (customer.address || customer.location) : "Unknown Address",
        customerPhone: customer ? customer.phone : "Unknown",
        chefAddress: chef ? (chef.address || chef.location) : "Unknown Address",
        chefPhone: chef ? chef.phone : "Unknown"
      };
    });

    res.json(enrichedOrders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching delivery orders" });
  }
});

app.put("/api/delivery/accept/:id", verifyToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const user = await User.findById(req.user.id);

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (order.status !== "accepted") return res.status(400).json({ msg: "Order not available for delivery" });

    order.status = "delivery_accepted";
    order.deliveryPartnerId = user._id;
    order.deliveryPartnerName = user.name;

    await order.save();

    res.json({ msg: "Delivery accepted", order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error accepting delivery" });
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

app.post("/api/cook-guide", verifyToken, async (req, res) => {
  try {
    const { dish, ingredients: userIngredients } = req.body;
    let prompt = "";

    if (dish) {
      prompt = `Provide a beginner-friendly cooking guide for "${dish}" in JSON format.
      Return a JSON object with:
      1. "name": name of the dish.
      2. "description": short tasty description.
      3. "isVeg": true/false.
      4. "time": total time (e.g., "30 mins").
      5. "difficulty": "Easy", "Medium", or "Hard".
      6. "ingredients": an array of strings with measurements.
      7. "instructions": a clear step-by-step array of strings.
      8. "tips": an array of 2-3 secret chef tips.
      9. "relatedSuggestions": an array of 2 similar dishes (each with name, description, isVeg, time, difficulty).
      Return ONLY valid JSON.`;
    } else if (userIngredients) {
      prompt = `I have these ingredients: ${userIngredients}. Suggest 3 beginner-friendly dishes in JSON format.
      Return a JSON object with:
      1. "recommendations": array of 3 objects. Each object must have: "name", "description", "isVeg", "time", "difficulty", "ingredients" (array of strings), "instructions" (array of strings), and "tips" (array of strings).
      Return ONLY valid JSON.`;
    } else {
      return res.status(400).json({ msg: "Please provide a dish or ingredients" });
    }

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "phi3:mini",
        prompt: prompt,
        stream: false,
        format: "json",
      }),
    });

    const data = await response.json();

    try {
      const rawText = data.response.trim();
      let cleaned = rawText;

      // Extract JSON part - look for the first '{' and the last '}'
      const startIdx = rawText.indexOf('{');
      const endIdx = rawText.lastIndexOf('}');

      if (startIdx !== -1 && endIdx !== -1) {
        cleaned = rawText.substring(startIdx, endIdx + 1);

        // Remove any double backticks that might have been caught inside
        // (sometimes models do ``` { ... } ```)
        cleaned = cleaned.replace(/```/g, "").trim();

        const jsonResponse = JSON.parse(cleaned);
        return res.json(jsonResponse);
      }

      // If no braces found, it's just plain text
      res.json({ response: rawText });

    } catch (e) {
      console.error("JSON Parse Error:", e);

      // Fallback: try to at least send the text between braces if they exist
      let fallbackText = data.response;
      const s = fallbackText.indexOf('{');
      const e_idx = fallbackText.lastIndexOf('}');
      if (s !== -1 && e_idx !== -1) {
        fallbackText = fallbackText.substring(s, e_idx + 1);
      }

      res.json({ response: fallbackText });
    }

  } catch (err) {
    console.error("Ollama Error:", err);
    res.status(500).json({ msg: "Error communicating with AI guide. Make sure Ollama is running." });
  }
});

// 🔹 SUBSCRIPTION MANAGEMENT ROUTES
app.post("/api/subscriptions/subscribe", verifyToken, async (req, res) => {
  try {
    const { item, chefId, chefName } = req.body;
    const user = await User.findById(req.user.id);

    // 💰 CHECK WALLET
    if (user.walletBalance < item.price) {
      return res.status(400).json({ msg: "Insufficient wallet balance for subscription." });
    }

    const days = parseInt(item.duration) || 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const deliverySchedule = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      deliverySchedule.push({ date, status: "pending" });
    }

    const subscription = new Subscription({
      userId: req.user.id,
      chefId: chefId || item.chefId,
      itemId: item._id || item.itemId,
      itemName: item.name,
      chefName: chefName || "Premium Chef",
      price: item.price,
      duration: item.duration,
      endDate: endDate,
      daysRemaining: days,
      deliverySchedule
    });

    await subscription.save();

    // 💰 DEDUCT & LOG
    user.walletBalance -= item.price;
    await user.save();

    const trans = new Transaction({
      userId: req.user.id,
      amount: item.price,
      type: "debit",
      description: `Subscription started: ${item.name}`
    });
    await trans.save();

    res.json({ msg: "Subscription started successfully!", subscription });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error starting subscription" });
  }
});

app.get("/api/subscriptions/my", verifyToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching subscriptions" });
  }
});

app.put("/api/subscriptions/update-status", verifyToken, async (req, res) => {
  try {
    const { subscriptionId, scheduleId, status } = req.body;
    const sub = await Subscription.findById(subscriptionId);

    if (!sub) return res.status(404).json({ msg: "Subscription not found" });

    const scheduleItem = sub.deliverySchedule.id(scheduleId);
    if (scheduleItem) {
      scheduleItem.status = status;
      await sub.save();
    }

    res.json({ msg: "Status updated", sub });
  } catch (err) {
    res.status(500).json({ msg: "Error updating status" });
  }
});

app.delete("/api/subscriptions/:id", verifyToken, async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ msg: "Subscription not found" });

    if (sub.userId !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ msg: "Subscription cancelled successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error cancelling subscription" });
  }
});

// 🔹 CHEF & DELIVERY SUBSCRIPTION ROUTES
app.get("/api/chef/subscriptions", verifyToken, async (req, res) => {
  try {
    const subs = await Subscription.find({ chefId: req.user.id }).sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching chef subscriptions" });
  }
});

app.get("/api/delivery/subscriptions/today", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find subscriptions that have a delivery scheduled for today with status 'pending'
    const subs = await Subscription.find({
      "deliverySchedule": {
        $elemMatch: {
          date: { $gte: today, $lt: tomorrow },
          status: "pending"
        }
      }
    });

    // Extract only today's schedule item for each sub
    const result = subs.map(sub => {
      const todayItem = sub.deliverySchedule.find(d =>
        new Date(d.date) >= today && new Date(d.date) < tomorrow
      );
      return {
        ...sub._doc,
        todaySchedule: todayItem
      };
    });

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching today's subscription deliveries" });
  }
});

// 🔹 WALLET ROUTES
app.post("/api/wallet/add-money", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    user.walletBalance += Number(amount);
    await user.save();

    const trans = new Transaction({
      userId: req.user.id,
      amount: Number(amount),
      type: "credit",
      description: "Wallet Top-up"
    });
    await trans.save();

    res.json({ msg: "Money added to wallet", balance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ msg: "Error adding money" });
  }
});

app.get("/api/wallet/transactions", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching transactions" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
