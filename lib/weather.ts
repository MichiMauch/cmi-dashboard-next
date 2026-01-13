/**
 * Weather Data Fetching Logic
 * Shared between API route and page component
 */

import * as SunCalc from 'suncalc';
import type {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
  ProcessedWeatherData,
  HourlyForecast,
  ForecastDay,
} from '@/types/weather';

const LOCATION = 'Muhen,CH';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Convert wind degree to cardinal direction
 */
function getWindDirection(deg: number): string {
  const directions = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

/**
 * Get day name from timestamp
 */
function getDayName(timestamp: number): string {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const date = new Date(timestamp * 1000);
  return days[date.getDay()];
}

/**
 * Format date to DD.MM
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}`;
}

/**
 * Fetch and process weather data from OpenWeather API
 */
export async function fetchWeatherData(): Promise<ProcessedWeatherData> {
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!API_KEY) {
    console.error('[Weather] OPENWEATHER_API_KEY not configured');
    throw new Error('OPENWEATHER_API_KEY not configured in environment variables');
  }

  console.log('[Weather] Fetching weather data for', LOCATION);

  const currentUrl = `${BASE_URL}/weather?q=${LOCATION}&appid=${API_KEY}&units=metric&lang=de`;
  const forecastUrl = `${BASE_URL}/forecast?q=${LOCATION}&appid=${API_KEY}&units=metric&lang=de`;

  // Fetch current weather and forecast in parallel
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl),
  ]);

  console.log('[Weather] Current API status:', currentResponse.status);
  console.log('[Weather] Forecast API status:', forecastResponse.status);

  if (!currentResponse.ok || !forecastResponse.ok) {
    const currentError = !currentResponse.ok ? await currentResponse.text() : null;
    const forecastError = !forecastResponse.ok ? await forecastResponse.text() : null;

    console.error('[Weather] API request failed');
    console.error('[Weather] Current error:', currentError);
    console.error('[Weather] Forecast error:', forecastError);

    throw new Error(`OpenWeather API request failed: ${currentError || forecastError}`);
  }

  const currentData: OpenWeatherCurrentResponse = await currentResponse.json();
  const forecastData: OpenWeatherForecastResponse = await forecastResponse.json();

  console.log('[Weather] Data fetched successfully');

  // Process hourly forecast for today (next 24 hours, 3h intervals)
  const now = Date.now() / 1000;
  const tomorrow = now + 86400;
  const hourly: HourlyForecast[] = forecastData.list
    .filter((item) => item.dt >= now && item.dt <= tomorrow)
    .slice(0, 8) // Max 8 intervals (24h)
    .map((item) => ({
      time: new Date(item.dt * 1000).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Zurich',
      }),
      timestamp: item.dt,
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      weather: item.weather[0].main,
      weatherDescription: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6), // m/s to km/h
      windDeg: item.wind.deg,
      pop: Math.round(item.pop * 100), // Probability of precipitation as percentage
    }));

  // Process daily forecast (group by day, find min/max temps)
  const dailyMap = new Map<string, ForecastDay>();

  forecastData.list.forEach((item) => {
    const date = formatDate(item.dt);
    const existing = dailyMap.get(date);

    if (!existing) {
      dailyMap.set(date, {
        date,
        dayName: getDayName(item.dt),
        timestamp: item.dt,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        weather: item.weather[0].main,
        weatherDescription: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 3.6),
        pop: Math.round(item.pop * 100),
        sunrise: 0, // Will be calculated later
        sunset: 0, // Will be calculated later
      });
    } else {
      // Update min/max temperatures
      existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
      existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
      // Use noon forecast for weather icon (more representative)
      if (item.dt_txt.includes('12:00:00')) {
        existing.weather = item.weather[0].main;
        existing.weatherDescription = item.weather[0].description;
        existing.icon = item.weather[0].icon;
      }
    }
  });

  // Calculate sunrise/sunset for each day using SunCalc
  const lat = currentData.coord.lat;
  const lon = currentData.coord.lon;

  const daily: ForecastDay[] = Array.from(dailyMap.values())
    .slice(0, 5) // 5 days
    .map((day) => {
      // Get sunrise/sunset times for this day
      const date = new Date(day.timestamp * 1000);
      const times = SunCalc.getTimes(date, lat, lon);

      return {
        ...day,
        tempMin: Math.round(day.tempMin),
        tempMax: Math.round(day.tempMax),
        sunrise: Math.floor(times.sunrise.getTime() / 1000), // Convert to Unix timestamp
        sunset: Math.floor(times.sunset.getTime() / 1000), // Convert to Unix timestamp
      };
    });

  // Build processed response
  const processedData: ProcessedWeatherData = {
    current: {
      temp: Math.round(currentData.main.temp),
      feelsLike: Math.round(currentData.main.feels_like),
      weather: currentData.weather[0].main,
      weatherDescription: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      humidity: currentData.main.humidity,
      pressure: currentData.main.pressure,
      windSpeed: Math.round(currentData.wind.speed * 3.6), // m/s to km/h
      windDeg: currentData.wind.deg,
      windDirection: getWindDirection(currentData.wind.deg),
      sunrise: currentData.sys.sunrise,
      sunset: currentData.sys.sunset,
      visibility: currentData.visibility,
      clouds: currentData.clouds.all,
    },
    hourly,
    daily,
    location: {
      name: currentData.name,
      country: currentData.sys.country,
    },
    timestamp: Date.now(),
  };

  return processedData;
}
