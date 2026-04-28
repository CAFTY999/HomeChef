const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  location: String,
  phone: String,
  address: String,

  role: {
    type: String,
    enum: ["customer", "chef", "admin"],
    default: "customer"
  },
  rating: {
    type: Number,
    default: 0
  },

  ratingCount: {
    type: Number,
    default: 0
  },
});

module.exports = mongoose.model("User", userSchema);