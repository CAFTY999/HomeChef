const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  location: String,
  coordinates: [Number], // [lat, lng]
  phone: String,
  address: String,

  role: {
    type: String,
    enum: ["customer", "chef", "admin", "delivery_partner"],
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
