const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerId: String,
  customerName: String,

  chefId: String,
  chefName: String,

  type: String, // daily / ready / subscription

  items: [
    {
      itemId: String,
      name: String,
      price: Number,
      quantity: Number
    }
  ],

  total: Number,

  status: {
    type: String,
    default: "pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  rated: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Order", orderSchema);