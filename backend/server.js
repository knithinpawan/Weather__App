const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const Weather = require("./models/Weather");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
// Allow all origins for deployment (Render + Vercel frontend)
app.use(cors());
app.use(express.json());

/* ---------------- SERVER ---------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* ---------------- ENV ---------------- */
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 5000;

/* ---------------- MONGODB ---------------- */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("Mongo Error:", err));

/* ---------------- ROUTES ---------------- */

// Home route
app.get("/", (req, res) => {
  res.send("Weather API Running ✅");
});

// Current weather + save
app.get("/api/weather/fetch/:city", async (req, res) => {
  try {
    const city = req.params.city;

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    const data = response.data;

    const weather = new Weather({
      city: data.name,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      wind: data.wind.speed,
      description: data.weather[0].description
    });

    await weather.save();

    res.json(weather);
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ message: "Weather fetch failed" });
  }
});

// 5-day forecast
app.get("/api/weather/forecast/:city", async (req, res) => {
  try {
    const city = req.params.city;

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );

    const list = response.data.list;

    const daily = list
      .filter((item) => item.dt_txt.includes("12:00:00"))
      .slice(0, 5);

    const forecast = daily.map((item) => ({
      date: item.dt_txt.split(" ")[0],
      temperature: item.main.temp,
      description: item.weather[0].description,
      icon: item.weather[0].icon
    }));

    res.json(forecast);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Forecast failed" });
  }
});

/* ---------------- SOCKET.IO ---------------- */
io.on("connection", (socket) => {
  console.log("User Connected");

  socket.on("searchCity", async (query) => {
    try {
      const results = await Weather.find({
        city: { $regex: query, $options: "i" }
      });

      socket.emit("searchResults", results);
    } catch (err) {
      console.log(err.message);
    }
  });
});

/* ---------------- START SERVER ---------------- */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});