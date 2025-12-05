/**
 * Shelly Cloud API Client
 * Handles fetching temperature and humidity data from Shelly H&T Gen3 sensors
 */

import dbConnect from './dbConnect';
import ShellyReading from '@/models/shelly-reading';

export interface ShellySensorData {
  id: string;
  name: string | null;
  online: boolean;
  temperature: number; // °C
  humidity: number; // %
  battery: number; // %
  batteryVoltage: number; // V
  lastUpdate: string;
  wifiSignal: number; // RSSI
}

export interface ShellyApiResponse {
  id: string;
  type: string;
  code: string;
  gen: string;
  online: number;
  status: {
    sys: {
      mac: string;
      time: string;
      unixtime: number;
    };
    'temperature:0': {
      id: number;
      tC: number;
      tF: number;
    };
    'humidity:0': {
      id: number;
      rh: number;
    };
    'devicepower:0': {
      id: number;
      battery: {
        V: number;
        percent: number;
      };
      external: {
        present: boolean;
      };
    };
    wifi: {
      sta_ip: string;
      status: string;
      ssid: string;
      rssi: number;
    };
    _updated: string;
  };
  settings: {
    sys: {
      device: {
        name: string | null;
        mac: string;
      };
    };
  };
}

/**
 * Fetch sensor data from Shelly Cloud API
 */
export async function fetchShellySensors(
  deviceIds: string[]
): Promise<ShellySensorData[]> {
  const host = process.env.SHELLY_CLOUD_HOST;
  const authKey = process.env.SHELLY_AUTH_KEY;

  if (!host || !authKey) {
    throw new Error('Missing SHELLY_CLOUD_HOST or SHELLY_AUTH_KEY environment variables');
  }

  if (deviceIds.length === 0) {
    return [];
  }

  // API allows max 10 devices per request
  if (deviceIds.length > 10) {
    throw new Error('Maximum 10 devices per request allowed');
  }

  const url = `https://${host}/v2/devices/api/get?auth_key=${authKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids: deviceIds,
      select: ['status', 'settings'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Shelly API error:', response.status, errorText);
    throw new Error(`Shelly API error: ${response.status} - ${errorText}`);
  }

  const data: ShellyApiResponse[] = await response.json();

  return data.map((device) => ({
    id: device.id,
    name: device.settings?.sys?.device?.name || null,
    online: device.online === 1,
    temperature: device.status['temperature:0']?.tC ?? 0,
    humidity: device.status['humidity:0']?.rh ?? 0,
    battery: device.status['devicepower:0']?.battery?.percent ?? 0,
    batteryVoltage: device.status['devicepower:0']?.battery?.V ?? 0,
    lastUpdate: device.status._updated || '',
    wifiSignal: device.status.wifi?.rssi ?? 0,
  }));
}

/**
 * Get device IDs from central configuration
 */
export { getAllDeviceIds as getShellyDeviceIds } from './shelly-config';

/**
 * Parse Shelly timestamp string to Date
 * Format: "2025-12-05 07:54:00"
 */
function parseShellyTimestamp(timestamp: string): Date {
  // Replace space with T for ISO format
  const isoString = timestamp.replace(' ', 'T') + 'Z';
  return new Date(isoString);
}

/**
 * Save sensor reading to MongoDB if it's newer than the last stored reading
 * Returns true if saved, false if skipped (duplicate)
 */
export async function saveReadingIfNew(sensor: ShellySensorData): Promise<boolean> {
  if (!sensor.lastUpdate) {
    return false;
  }

  try {
    await dbConnect();

    const timestamp = parseShellyTimestamp(sensor.lastUpdate);

    // Use upsert with unique index - will fail silently if duplicate
    await ShellyReading.updateOne(
      { deviceId: sensor.id, timestamp },
      {
        $setOnInsert: {
          deviceId: sensor.id,
          timestamp,
          temperature: sensor.temperature,
          humidity: sensor.humidity,
          battery: sensor.battery,
        },
      },
      { upsert: true }
    );

    console.log(`[Shelly] Saved reading for ${sensor.id} at ${sensor.lastUpdate}`);
    return true;
  } catch (error) {
    // Duplicate key error is expected, ignore it
    if ((error as { code?: number }).code === 11000) {
      console.log(`[Shelly] Skipped duplicate reading for ${sensor.id} at ${sensor.lastUpdate}`);
      return false;
    }
    console.error('[Shelly] Error saving reading:', error);
    throw error;
  }
}

/**
 * Save multiple sensor readings
 */
export async function saveAllReadings(sensors: ShellySensorData[]): Promise<number> {
  let saved = 0;
  for (const sensor of sensors) {
    const wasSaved = await saveReadingIfNew(sensor);
    if (wasSaved) saved++;
  }
  return saved;
}

/**
 * Get historical readings for a device
 */
export async function getHistoricalReadings(
  deviceId: string,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<{ timestamp: Date; temperature: number; humidity: number }[]> {
  await dbConnect();

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const readings = await ShellyReading.find({
    deviceId,
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: 1 })
    .select('timestamp temperature humidity -_id')
    .lean();

  return readings;
}

/**
 * Get aggregated readings (daily averages for month/year views)
 */
export async function getAggregatedReadings(
  deviceId: string,
  period: 'month' | 'year'
): Promise<{ date: string; avgTemp: number; avgHumidity: number; minTemp: number; maxTemp: number }[]> {
  await dbConnect();

  const now = new Date();
  const startDate = period === 'month'
    ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const groupBy = period === 'month'
    ? { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
    : { $dateToString: { format: '%Y-%m', date: '$timestamp' } };

  const aggregation = await ShellyReading.aggregate([
    {
      $match: {
        deviceId,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: groupBy,
        avgTemp: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        minTemp: { $min: '$temperature' },
        maxTemp: { $max: '$temperature' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return aggregation.map((item) => ({
    date: item._id,
    avgTemp: Math.round(item.avgTemp * 10) / 10,
    avgHumidity: Math.round(item.avgHumidity * 10) / 10,
    minTemp: Math.round(item.minTemp * 10) / 10,
    maxTemp: Math.round(item.maxTemp * 10) / 10,
  }));
}
