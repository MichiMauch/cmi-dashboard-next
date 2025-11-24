/**
 * Victron Energy VRM API Client
 * Handles authentication and data fetching from Victron VRM API
 */

import {
  VictronStatsResponse,
  VictronTokenResponse,
  VictronLoginRequest,
  SolarData,
} from '@/types/victron';

const VRM_API_BASE = 'https://vrmapi.victronenergy.com/v2';

/**
 * Login to Victron VRM API and get access token
 */
export async function loginToVictron(
  username: string,
  password: string
): Promise<string> {
  console.log('Attempting Victron login for user:', username);

  const response = await fetch(`${VRM_API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Victron login failed:', response.status, errorText);
    throw new Error(`Victron login failed: ${response.status} - ${errorText}`);
  }

  const data: VictronTokenResponse = await response.json();
  console.log('Victron login successful, token received');
  return data.token;
}

/**
 * Fetch stats from Victron VRM API
 */
export async function fetchVictronStats(
  installationId: string,
  token: string,
  interval: string = '15mins',
  type?: string,
  start?: string,
  end?: string
): Promise<VictronStatsResponse> {
  const params = new URLSearchParams({
    interval,
    ...(type && { type }),
    ...(start && { start }),
    ...(end && { end }),
  });

  const url = `${VRM_API_BASE}/installations/${installationId}/stats?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'x-authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error(`Victron API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Process raw Victron data into usable format
 */
export function processSolarData(stats: VictronStatsResponse): SolarData {
  const { records } = stats;

  // Log available fields for debugging (only in development)
  // console.log('[processSolarData] Available fields:', Object.keys(records));

  // Get latest values from arrays
  const getLatestValue = (dataPoints?: Array<[number, number, number, number]>) => {
    if (!dataPoints || dataPoints.length === 0) return 0;
    const value = dataPoints[dataPoints.length - 1][1] || 0;
    return value;
  };

  const getLatestTimestamp = (dataPoints?: Array<[number, number, number, number]>) => {
    if (!dataPoints || dataPoints.length === 0) return Date.now() / 1000;
    return dataPoints[dataPoints.length - 1][0] || Date.now() / 1000;
  };

  // Sum all values from today (like the old project does)
  const getTodaySum = (dataPoints?: Array<any>) => {
    if (!dataPoints || dataPoints.length === 0) {
      return 0;
    }

    const today = new Date().setHours(0, 0, 0, 0);

    // Try both possible formats: with and without *1000
    const filtered = dataPoints.filter(([timestamp]) => {
      // Try timestamp as-is first (might already be in milliseconds)
      let recordDate1 = new Date(timestamp).setHours(0, 0, 0, 0);
      // Try timestamp * 1000 (if in seconds)
      let recordDate2 = new Date(timestamp * 1000).setHours(0, 0, 0, 0);

      return recordDate1 === today || recordDate2 === today;
    });

    const sum = filtered.reduce((sum, point) => {
      // Handle both [timestamp, value] and [timestamp, value, ..., ...]
      const value = point[1] || 0;
      return sum + value;
    }, 0);

    return sum;
  };

  /**
   * Detect if currently using grid power by analyzing multiple indicators
   */
  const isUsingGridPower = (): boolean => {
    const gridData = records.grid_history_from;
    const solarPower = getLatestValue(records.Pdc);
    const batteryCharge = getLatestValue(records.bs);
    const consumption = getTodaySum(records.total_consumption);

    // Log grid_history_from for debugging
    if (gridData && Array.isArray(gridData) && gridData.length >= 3) {
      const recentPoints = gridData.slice(-10);
      const firstValue = recentPoints[0][1] || 0;
      const lastValue = recentPoints[recentPoints.length - 1][1] || 0;
      const previousValue = recentPoints[recentPoints.length - 2][1] || 0;

      console.log('[isUsingGridPower] grid_history_from:', {
        first: firstValue.toFixed(6),
        previous: previousValue.toFixed(6),
        last: lastValue.toFixed(6),
        recentDiff: (lastValue - previousValue).toFixed(6),
        overallDiff: (lastValue - firstValue).toFixed(6)
      });

      // Check if value increased in last interval (ANY increase)
      const recentIncrease = lastValue > previousValue;
      // Check if value increased over recent period
      const overallIncrease = lastValue > firstValue;

      if (recentIncrease || overallIncrease) {
        console.log('[isUsingGridPower] ON GRID (grid_history_from increasing)');
        return true;
      }
    }

    // Method 2: Logic based approach
    // If solar is very low (<100W) and there's consumption, power must come from battery or grid
    // If battery is not very high, assume grid is being used
    if (solarPower < 100 && consumption > 0 && batteryCharge < 80) {
      console.log('[isUsingGridPower] ON GRID (low solar + consumption + battery not full) -', {
        battery: batteryCharge + '%',
        solar: solarPower.toFixed(1) + 'W',
        consumption: consumption.toFixed(2) + 'kWh'
      });
      return true;
    }

    console.log('[isUsingGridPower] AUTARK -', {
      battery: batteryCharge + '%',
      solar: solarPower.toFixed(1) + 'W'
    });
    return false;
  };

  // Detect grid usage
  const usingGrid = isUsingGridPower();

  const processedData = {
    currentPower: getLatestValue(records.Pdc), // Solar power
    batteryCharge: getLatestValue(records.bs), // Battery %
    batteryPower: getLatestValue(records.Pb), // Battery power (not available)
    gridPower: usingGrid ? 1 : 0, // Use grid detection instead of Pg field
    consumption: getLatestValue(records.Pac), // AC consumption (not available)
    todayYield: getTodaySum(records.total_solar_yield), // Sum all today's values
    todayConsumption: getTodaySum(records.total_consumption), // Sum all today's values
    timestamp: getLatestTimestamp(records.Pdc),
  };

  return processedData;
}
