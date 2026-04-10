const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema(
  {
    city: String,
    temperature: Number,
    humidity: Number,
    wind: Number,
    description: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Weather", weatherSchema);