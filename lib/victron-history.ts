/**
 * Victron Historical Data Helpers
 * Functions to fetch historical solar data
 */

import { fetchVictronStats } from './victron';
import { fetchWithTokenRefresh } from './victron-token';

const INSTALLATION_ID = process.env.VICTRON_INSTALLATION_ID!;

export interface DayStats {
  timestamp: number;
  total_solar_yield: number;
  total_consumption: number;
  average_power: number;
  peak_power: number;
  total_energy_imported: number;
  total_energy_exported: number;
}

export interface MonthStats {
  timestamp: number;
  total_solar_yield: number;
}

export interface AutarkieStats {
  total_solar_yield: number;
  total_consumption: number;
  grid_history_from: number;
  autarkie: number;
}

/**
 * Get timestamps for last N days
 */
function getLastNDaysTimestamps(days: number): Array<{ start: number; end: number }> {
  const timestamps = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const start = Math.floor(date.getTime() / 1000);
    date.setHours(23, 59, 59, 999);
    const end = Math.floor(date.getTime() / 1000);
    timestamps.unshift({ start, end });
  }

  return timestamps;
}

/**
 * Get timestamps for last N months
 */
function getLastNMonthsTimestamps(months: number): Array<{ start: number; end: number }> {
  const timestamps = [];
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);

  for (let i = months - 1; i >= 0; i--) {
    const monthOffset = today.getMonth() - i;
    const date = new Date(today.getFullYear(), monthOffset, 1);
    const start = date.getTime();
    date.setMonth(date.getMonth() + 1, 0);
    date.setHours(23, 59, 59, 999);
    const end = date.getTime();
    timestamps.push({ start: Math.floor(start / 1000), end: Math.floor(end / 1000) });
  }

  return timestamps;
}

/**
 * Get current year monthly timestamps
 */
function getCurrentYearMonthlyTimestamps(): Array<{ start: number; end: number }> {
  const timestamps = [];
  const today = new Date();
  const year = today.getFullYear();

  for (let month = 0; month < 12; month++) {
    const startOfMonth = new Date(year, month, 1).getTime();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    timestamps.push({
      start: Math.floor(startOfMonth / 1000),
      end: Math.floor(endOfMonth / 1000),
    });
  }

  return timestamps;
}

/**
 * Fetch last 7 days of solar history
 */
export async function fetchLast7Days(): Promise<DayStats[]> {
  const timestamps = getLastNDaysTimestamps(7);

  const results = await Promise.all(
    timestamps.map(async ({ start, end }) => {
      console.log('[fetchLast7Days] Fetching day:', new Date(start * 1000).toISOString());

      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'days', 'kwh', start.toString())
      );

      console.log('[fetchLast7Days] Response keys:', Object.keys(stats.records));
      console.log('[fetchLast7Days] Sample data:', {
        total_solar_yield: stats.records.total_solar_yield,
        total_consumption: stats.records.total_consumption,
        Pdc: stats.records.Pdc ? `${stats.records.Pdc.length} entries` : 'missing',
      });

      const records = stats.records;

      // Calculate peak power for the day - handle both array and single value
      let peakPower = 0;
      if (records.Pdc && Array.isArray(records.Pdc)) {
        peakPower = Math.max(...records.Pdc.map((item) => item[1]));
      }

      // Historical data uses different format - single values not arrays
      return {
        timestamp: start * 1000,
        total_solar_yield: records.total_solar_yield?.[0]?.[1] ?? 0,
        total_consumption: records.total_consumption?.[0]?.[1] ?? 0,
        average_power: records.average_power?.[0]?.[1] ?? 0,
        peak_power: peakPower,
        total_energy_imported: records.total_energy_imported?.[0]?.[1] ?? 0,
        total_energy_exported: records.total_energy_exported?.[0]?.[1] ?? 0,
      };
    })
  );

  return results;
}

/**
 * Fetch last 24 months of solar yield
 */
export async function fetchLast24Months(): Promise<MonthStats[]> {
  const timestamps = getLastNMonthsTimestamps(24);

  const results = await Promise.all(
    timestamps.map(async ({ start, end }) => {
      console.log('[fetchLast24Months] Fetching month:', new Date(start * 1000).toISOString());

      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'months', 'kwh', start.toString())
      );

      console.log('[fetchLast24Months] Response keys:', Object.keys(stats.records));
      console.log('[fetchLast24Months] total_solar_yield:', stats.records?.total_solar_yield);

      return {
        timestamp: start,
        total_solar_yield: stats.records?.total_solar_yield?.[0]?.[1] ?? 0,
      };
    })
  );

  return results;
}

/**
 * Calculate autarkie (self-sufficiency) for current year
 */
export async function fetchAutarkieStats(): Promise<AutarkieStats> {
  const timestamps = getCurrentYearMonthlyTimestamps();

  console.log('[fetchAutarkieStats] Fetching', timestamps.length, 'months');

  const results = await Promise.all(
    timestamps.map(async ({ start, end }) => {
      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'months', 'kwh', start.toString())
      );

      console.log('[fetchAutarkieStats] Month response keys:', Object.keys(stats.records));

      return stats.records;
    })
  );

  // Sum up monthly results
  let totalSolarYield = 0;
  let totalConsumption = 0;
  let gridHistoryFrom = 0;

  results.forEach((records, index) => {
    console.log(`[fetchAutarkieStats] Month ${index} data:`, {
      total_solar_yield: records.total_solar_yield,
      total_consumption: records.total_consumption,
      grid_history_from: records.grid_history_from,
    });

    if (records.total_solar_yield && Array.isArray(records.total_solar_yield)) {
      totalSolarYield += records.total_solar_yield[0][1];
    }
    if (records.total_consumption && Array.isArray(records.total_consumption)) {
      totalConsumption += records.total_consumption[0][1];
    }
    if (records.grid_history_from && Array.isArray(records.grid_history_from)) {
      gridHistoryFrom += records.grid_history_from[0][1];
    }
  });

  const autarkie = totalConsumption > 0
    ? ((totalConsumption - gridHistoryFrom) / totalConsumption) * 100
    : 0;

  console.log('[fetchAutarkieStats] Totals:', {
    totalSolarYield,
    totalConsumption,
    gridHistoryFrom,
    autarkie,
  });

  return {
    total_solar_yield: totalSolarYield,
    total_consumption: totalConsumption,
    grid_history_from: gridHistoryFrom,
    autarkie: parseFloat(autarkie.toFixed(2)),
  };
}
