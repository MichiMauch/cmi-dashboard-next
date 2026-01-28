/**
 * Shelly Sensors API Route
 * Returns flat JSON with sensor data (temperature, humidity, battery, name)
 * Includes weather data from OpenWeather API
 * Includes in-memory caching to prevent rate limiting
 */

import { NextResponse } from 'next/server';
import { fetchShellySensors, getShellyDeviceIds, ShellySensorData } from '@/lib/shelly';
import { getRoomByDeviceId } from '@/lib/shelly-config';
import { fetchWeatherData } from '@/lib/weather';

export const dynamic = 'force-dynamic';

interface FlatSensorData {
  name: string;
  temperature: number;
  humidity: number;
  battery?: number;      // Optional (nicht bei Wetter)
  sunrise?: string;      // Optional (nur bei Wetter)
  sunset?: string;       // Optional (nur bei Wetter)
}

/**
 * Format Unix timestamp to HH:mm in Swiss timezone
 */
function formatTime(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich',
  });
}

// In-memory cache with request coalescing to prevent race conditions
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes cache
let cachedData: { sensors: FlatSensorData[]; timestamp: number } | null = null;
let pendingRequest: Promise<FlatSensorData[]> | null = null;

function transformToFlatFormat(sensors: ShellySensorData[]): FlatSensorData[] {
  return sensors.map((sensor) => {
    const room = getRoomByDeviceId(sensor.id);
    return {
      name: room?.name || sensor.name || sensor.id,
      temperature: sensor.temperature,
      humidity: sensor.humidity,
      battery: sensor.battery,
    };
  });
}

export async function GET() {
  try {
    const deviceIds = getShellyDeviceIds();

    if (deviceIds.length === 0) {
      return NextResponse.json(
        { error: 'No Shelly device IDs configured' },
        { status: 400 }
      );
    }

    // Check if cached data is still valid
    const now = Date.now();
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION_MS) {
      console.log('[Shelly Sensors API] Returning cached data');
      return NextResponse.json(cachedData.sensors);
    }

    // If a request is already in progress, wait for it (request coalescing)
    if (pendingRequest) {
      console.log('[Shelly Sensors API] Waiting for pending request');
      const sensors = await pendingRequest;
      return NextResponse.json(sensors);
    }

    // Start new request with coalescing
    console.log('[Shelly Sensors API] Fetching fresh data from Shelly Cloud and Weather API');
    pendingRequest = (async () => {
      // Fetch Shelly sensors and weather data in parallel
      const [rawSensors, weatherData] = await Promise.all([
        fetchShellySensors(deviceIds),
        fetchWeatherData().catch((error) => {
          console.error('[Shelly Sensors API] Weather fetch failed:', error);
          return null; // Return null on error, Shelly data still works
        }),
      ]);

      const sensors = transformToFlatFormat(rawSensors);

      // Add weather as last element if available
      if (weatherData) {
        sensors.push({
          name: 'Wetter',
          temperature: weatherData.current.temp,
          humidity: weatherData.current.humidity,
          sunrise: formatTime(weatherData.current.sunrise),
          sunset: formatTime(weatherData.current.sunset),
        });
      }

      cachedData = { sensors, timestamp: Date.now() };
      return sensors;
    })();

    try {
      const sensors = await pendingRequest;
      return NextResponse.json(sensors);
    } finally {
      pendingRequest = null;
    }
  } catch (error) {
    console.error('[Shelly Sensors API] Error fetching sensor data:', error);

    // If we have cached data, return it even if expired
    if (cachedData) {
      console.log('[Shelly Sensors API] Returning stale cached data due to error');
      return NextResponse.json(cachedData.sensors);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
