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

  // Log available fields for debugging
  console.log('[processSolarData] Available fields:', Object.keys(records));
  console.log('[processSolarData] Field details:', {
    Pdc: records.Pdc ? `${records.Pdc.length} entries` : 'missing',
    bs: records.bs ? `${records.bs.length} entries` : 'missing',
    Pb: records.Pb ? `${records.Pb.length} entries` : 'missing',
    Pg: records.Pg ? `${records.Pg.length} entries` : 'missing',
    Pac: records.Pac ? `${records.Pac.length} entries` : 'missing',
    total_solar_yield: records.total_solar_yield ? `${records.total_solar_yield.length} entries` : 'missing',
    total_consumption: records.total_consumption ? `${records.total_consumption.length} entries` : 'missing',
  });

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
      console.log('[getTodaySum] No data points provided or empty array');
      return 0;
    }

    console.log('[getTodaySum] Sample data point:', dataPoints[0]);
    console.log('[getTodaySum] Total data points:', dataPoints.length);

    const today = new Date().setHours(0, 0, 0, 0);
    console.log('[getTodaySum] Today timestamp (midnight):', today);

    // Try both possible formats: with and without *1000
    const filtered = dataPoints.filter(([timestamp]) => {
      // Try timestamp as-is first (might already be in milliseconds)
      let recordDate1 = new Date(timestamp).setHours(0, 0, 0, 0);
      // Try timestamp * 1000 (if in seconds)
      let recordDate2 = new Date(timestamp * 1000).setHours(0, 0, 0, 0);

      return recordDate1 === today || recordDate2 === today;
    });

    console.log('[getTodaySum] Filtered data points for today:', filtered.length);

    if (filtered.length > 0) {
      console.log('[getTodaySum] Sample filtered point:', filtered[0]);
    }

    const sum = filtered.reduce((sum, point) => {
      // Handle both [timestamp, value] and [timestamp, value, ..., ...]
      const value = point[1] || 0;
      return sum + value;
    }, 0);

    console.log('[getTodaySum] Sum result:', sum);
    return sum;
  };

  const processedData = {
    currentPower: getLatestValue(records.Pdc), // Solar power
    batteryCharge: getLatestValue(records.bs), // Battery %
    batteryPower: getLatestValue(records.Pb), // Battery power
    gridPower: getLatestValue(records.Pg), // Grid power
    consumption: getLatestValue(records.Pac), // AC consumption
    todayYield: getTodaySum(records.total_solar_yield), // Sum all today's values
    todayConsumption: getTodaySum(records.total_consumption), // Sum all today's values
    timestamp: getLatestTimestamp(records.Pdc),
  };

  console.log('[processSolarData] Processed values:', processedData);

  return processedData;
}
