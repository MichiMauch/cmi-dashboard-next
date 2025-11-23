/**
 * OpenWeather API Type Definitions
 * Types for weather data from OpenWeather API
 */

/**
 * OpenWeather Current Weather API Response
 */
export interface OpenWeatherCurrentResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

/**
 * OpenWeather 5-Day Forecast API Response
 */
export interface OpenWeatherForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number;
    sys: {
      pod: string;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

/**
 * Hourly forecast data (3-hour intervals)
 */
export interface HourlyForecast {
  time: string;
  timestamp: number;
  temp: number;
  feelsLike: number;
  weather: string;
  weatherDescription: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  pop: number; // Probability of precipitation
}

/**
 * Daily forecast data
 */
export interface ForecastDay {
  date: string;
  dayName: string;
  timestamp: number;
  tempMin: number;
  tempMax: number;
  weather: string;
  weatherDescription: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pop: number;
}

/**
 * Processed weather data for UI consumption
 */
export interface ProcessedWeatherData {
  current: {
    temp: number;
    feelsLike: number;
    weather: string;
    weatherDescription: string;
    icon: string;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDeg: number;
    windDirection: string;
    sunrise: number;
    sunset: number;
    visibility: number;
    clouds: number;
  };
  hourly: HourlyForecast[];
  daily: ForecastDay[];
  location: {
    name: string;
    country: string;
  };
  timestamp: number;
}
