import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);

  /* ---------------- SEARCH ---------------- */
  const searchWeather = async () => {
    if (!city) return;

    try {
      const weatherRes = await axios.get(
        `${API}/api/weather/fetch/${city}`
      );

      setWeather(weatherRes.data);

      const forecastRes = await axios.get(
        `${API}/api/weather/forecast/${city}`
      );

      setForecast(forecastRes.data);

    } catch (err) {
      console.log(err);
      alert("City not found or server error");
    }
  };

  /* ---------------- LOCATION WEATHER ---------------- */
  const getLocationWeather = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=YOUR_API_KEY&units=metric`
        );

        setWeather({
          city: res.data.name,
          temperature: res.data.main.temp,
          humidity: res.data.main.humidity,
          wind: res.data.wind.speed,
          description: res.data.weather[0].description
        });

      } catch {
        alert("Location error");
      }
    });
  };

  return (
    <div className="container">
      <h1>🌤 Weather App</h1>

      <div className="search-bar">
        <span onClick={getLocationWeather}>📍</span>

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
        />

        <button onClick={searchWeather}>Search</button>
      </div>

      {/* CURRENT WEATHER */}
      {weather && (
        <div className="card">
          <h2>{weather.city}</h2>
          <p>Temperature: {weather.temperature}°C</p>
          <p>Humidity: {weather.humidity}%</p>
          <p>Wind: {weather.wind} m/s</p>
          <p>{weather.description}</p>
        </div>
      )}

      {/* 5 DAY FORECAST */}
      {forecast.length > 0 && (
        <div className="forecast">
          <h2>5 Day Forecast</h2>

          <div className="forecast-grid">
            {forecast.map((day, i) => (
              <div key={i} className="forecast-card">
                <p>{day.date}</p>

                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                  alt="icon"
                />

                <p>{day.temperature}°C</p>
                <p>{day.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;