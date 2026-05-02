const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  chefId: { type: String, required: true },
  itemId: { type: String, required: true },
  itemName: String,
  chefName: String,
  price: Number,
  duration: String, // e.g., "30 Days"
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  status: { type: String, enum: ["active", "paused", "completed"], default: "active" },
  daysRemaining: Number,
  skippedDates: [Date], // Dates user chose to skip
  deliverySchedule: [
    {
      date: Date,
      status: { type: String, enum: ["pending", "delivered", "skipped"], default: "pending" }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
