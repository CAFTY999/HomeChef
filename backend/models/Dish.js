const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["daily", "subscription", "ready"],
    required: true
  },

  name: String,
  description: String,
  price: Number,

  // 🔹 COMMON INVENTORY
  totalQuantity: Number, // 🔥 works for all types

  // 🔹 DAILY
  serves: Number,
  availableFrom: String,
  availableTo: String,

  // 🔹 SUBSCRIPTION
  meals: [
    {
      categories: [
        {
          name: String,
          options: [String]
        }
      ]
    }
  ],

  // 🔹 READY
  stock: Number, // optional (can remove later)

  chefId: String
});

module.exports = mongoose.model("Item", itemSchema);