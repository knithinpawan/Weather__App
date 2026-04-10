const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const Weather = require("./models/Weather");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const API_KEY = process.env.API_KEY;

/* ---------------- MONGODB ---------------- */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

/* ---------------- HOME ---------------- */
app.get("/", (req, res) => {
  res.send("Weather API Running ✅");
});

/* ---------------- CURRENT WEATHER + SAVE ---------------- */
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

    res.json({
      city: weather.city,
      temperature: weather.temperature,
      humidity: weather.humidity,
      wind: weather.wind,
      description: weather.description
    });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ message: "Weather fetch failed" });
  }
});

/* ---------------- 5 DAY FORECAST ---------------- */
app.get("/api/weather/forecast/:city", async (req, res) => {
  try {
    const city = req.params.city;

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );

    const list = response.data.list;

    const daily = list.filter(item =>
      item.dt_txt.includes("12:00:00")
    ).slice(0, 5);

    const forecast = daily.map(item => ({
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

/* ---------------- SOCKET SEARCH ---------------- */
io.on("connection", (socket) => {
  console.log("User Connected");

  socket.on("searchCity", async (query) => {
    const results = await Weather.find({
      city: { $regex: query, $options: "i" }
    });

    socket.emit("searchResults", results);
  });
});

/* ---------------- START SERVER ---------------- */
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});