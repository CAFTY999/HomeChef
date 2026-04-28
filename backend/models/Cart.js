const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: String,
  type: String, // daily | subscription | ready
  chefId: String,

  items: [
    {
      itemId: String,
      name: String,
      price: Number,
      quantity: Number
    }
  ]
});

module.exports = mongoose.model("Cart", cartSchema);