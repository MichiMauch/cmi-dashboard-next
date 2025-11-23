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
  const response = await fetch(`${VRM_API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Victron login failed: ${response.statusText}`);
  }

  const data: VictronTokenResponse = await response.json();
  return data.token;
}

/**
 * Fetch stats from Victron VRM API
 */
export async function fetchVictronStats(
  installationId: string,
  token: string,
  interval: string = '15mins',
  type: string = 'live_feed',
  start?: string
): Promise<VictronStatsResponse> {
  const params = new URLSearchParams({
    interval,
    type,
    ...(start && { start }),
  });

  const url = `${VRM_API_BASE}/installations/${installationId}/stats?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'x-authorization': `Bearer ${token}`,
    },
    next: {
      revalidate: type === 'live_feed' ? 300 : 3600, // 5 min for live, 1h for historical
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

  // Get latest values from arrays
  const getLatestValue = (dataPoints?: Array<[number, number, number, number]>) => {
    if (!dataPoints || dataPoints.length === 0) return 0;
    return dataPoints[dataPoints.length - 1][1] || 0;
  };

  const getLatestTimestamp = (dataPoints?: Array<[number, number, number, number]>) => {
    if (!dataPoints || dataPoints.length === 0) return Date.now() / 1000;
    return dataPoints[dataPoints.length - 1][0] || Date.now() / 1000;
  };

  return {
    currentPower: getLatestValue(records.Pdc), // Solar power
    batteryCharge: getLatestValue(records.bs), // Battery %
    batteryPower: getLatestValue(records.Pb), // Battery power
    gridPower: getLatestValue(records.Pg), // Grid power
    consumption: getLatestValue(records.Pac), // AC consumption
    todayYield: getLatestValue(records.total_solar_yield),
    todayConsumption: getLatestValue(records.total_consumption),
    timestamp: getLatestTimestamp(records.Pdc),
  };
}
