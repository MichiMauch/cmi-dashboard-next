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
  total_consumption: number;
  grid_history_from: number;
}

export interface AutarkieStats {
  total_solar_yield: number;
  total_consumption: number;
  grid_history_from: number;
  autarkie: number;
}

export interface PeakPowerHistoryStats {
  timestamp: number;
  peak_power: number;
}

export interface YearGridImportStats {
  year: string;
  gridImport: number;
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

  // Start from previous month (exclude current incomplete month)
  for (let i = 0; i < months; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - 1 - i, 1);
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
 * Fetch last 11 days of solar history
 */
export async function fetchLast7Days(): Promise<DayStats[]> {
  const timestamps = getLastNDaysTimestamps(11);

  const results = await Promise.all(
    timestamps.map(async ({ start, end }) => {
      console.log('[fetchLast7Days] Fetching day:', new Date(start * 1000).toISOString());

      // Use interval=days without type parameter to get daily aggregated data
      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'days', undefined, start.toString(), end.toString())
      );

      console.log('[fetchLast7Days] Response keys:', Object.keys(stats.records));
      console.log('[fetchLast7Days] Sample data:', {
        total_solar_yield: stats.records.total_solar_yield,
        total_consumption: stats.records.total_consumption,
        Pdc: stats.records.Pdc ? `${stats.records.Pdc.length} entries` : 'missing',
      });

      const records = stats.records;

      // Calculate peak power for the day (max value from Pdc array)
      let peakPower = 0;
      if (records.Pdc && Array.isArray(records.Pdc) && records.Pdc.length > 0) {
        peakPower = Math.max(...records.Pdc.map((item) => item[1]));
      }

      // Extract aggregated values from API response (pre-calculated by Victron API)
      // For interval=days, the API returns a single aggregated value at [0][1]
      const totalSolarYield = records.total_solar_yield?.[0]?.[1] ?? 0;
      const totalConsumption = records.total_consumption?.[0]?.[1] ?? 0;
      const averagePower = records.average_power?.[0]?.[1] ?? 0;
      const totalEnergyImported = records.total_energy_imported?.[0]?.[1] ?? 0;
      const totalEnergyExported = records.total_energy_exported?.[0]?.[1] ?? 0;

      return {
        timestamp: start * 1000,
        total_solar_yield: totalSolarYield,
        total_consumption: totalConsumption,
        average_power: averagePower,
        peak_power: peakPower,
        total_energy_imported: totalEnergyImported,
        total_energy_exported: totalEnergyExported,
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

      // Use interval=months without type parameter to get monthly aggregated data
      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'months', undefined, start.toString(), end.toString())
      );

      console.log('[fetchLast24Months] Response keys:', Object.keys(stats.records));
      console.log('[fetchLast24Months] total_solar_yield:', stats.records?.total_solar_yield);
      console.log('[fetchLast24Months] total_consumption:', stats.records?.total_consumption);
      console.log('[fetchLast24Months] grid_history_from:', stats.records?.grid_history_from);

      const records = stats.records;

      // Extract aggregated values from API response (pre-calculated by Victron API)
      // For interval=months, the API sometimes returns multiple values
      // We take the MAXIMUM value to ensure we get the accumulated total, not a small initial value
      // Note: API returns different tuple sizes for different intervals, so we use any to handle this
      const totalSolarYield = records.total_solar_yield && records.total_solar_yield.length > 0
        ? Math.max(...records.total_solar_yield.map((item: any) => item[1]))
        : 0;
      const totalConsumption = records.total_consumption && records.total_consumption.length > 0
        ? Math.max(...records.total_consumption.map((item: any) => item[1]))
        : 0;
      const gridHistoryFrom = records.grid_history_from?.[records.grid_history_from.length - 1]?.[1] ?? 0;

      return {
        timestamp: start * 1000,
        total_solar_yield: totalSolarYield,
        total_consumption: totalConsumption,
        grid_history_from: gridHistoryFrom,
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
      // Use interval=months without type parameter to get monthly aggregated data
      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'months', undefined, start.toString(), end.toString())
      );

      console.log('[fetchAutarkieStats] Month response keys:', Object.keys(stats.records));

      const records = stats.records;

      // Extract aggregated values from API response (pre-calculated by Victron API)
      // For interval=months, the API returns a single aggregated value at [0][1]
      const monthSolarYield = records.total_solar_yield?.[0]?.[1] ?? 0;
      const monthConsumption = records.total_consumption?.[0]?.[1] ?? 0;
      const monthGridHistoryFrom = records.grid_history_from?.[0]?.[1] ?? 0;

      console.log('[fetchAutarkieStats] Month data:', {
        solar_yield: monthSolarYield,
        consumption: monthConsumption,
        grid_from: monthGridHistoryFrom,
      });

      return {
        solar_yield: monthSolarYield,
        consumption: monthConsumption,
        grid_from: monthGridHistoryFrom,
      };
    })
  );

  // Sum up monthly results
  let totalSolarYield = 0;
  let totalConsumption = 0;
  let gridHistoryFrom = 0;

  results.forEach((monthData, index) => {
    console.log(`[fetchAutarkieStats] Month ${index} data:`, monthData);

    totalSolarYield += monthData.solar_yield;
    totalConsumption += monthData.consumption;
    gridHistoryFrom += monthData.grid_from;
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

/**
 * Fetch peak power for last 30 days
 */
export async function fetchLast30DaysPeakPower(): Promise<PeakPowerHistoryStats[]> {
  const timestamps = getLastNDaysTimestamps(30);

  console.log('[fetchLast30DaysPeakPower] Fetching peak power for 30 days');

  const results = await Promise.all(
    timestamps.map(async ({ start, end }) => {
      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, '15mins', undefined, start.toString(), end.toString())
      );

      const records = stats.records;

      // Find the highest Pdc (solar power) value for the day
      if (!records.Pdc || !Array.isArray(records.Pdc) || records.Pdc.length === 0) {
        return {
          timestamp: start * 1000, // Convert to milliseconds
          peak_power: 0,
        };
      }

      const peakPowerEntry = records.Pdc.reduce(
        (max, entry) => (entry[1] > max[1] ? entry : max),
        [0, 0]
      );

      return {
        timestamp: start * 1000, // Use day start timestamp, not peak entry time
        peak_power: peakPowerEntry[1],
      };
    })
  );

  return results;
}

/**
 * Fetch last 5 years of grid import data
 */
export async function fetchLast5YearsGridImport(): Promise<YearGridImportStats[]> {
  const currentYear = new Date().getFullYear();
  const years = [];

  // Generate last 5 years
  for (let i = 4; i >= 0; i--) {
    years.push(currentYear - i);
  }

  console.log('[fetchLast5YearsGridImport] Fetching years:', years);

  const results = await Promise.all(
    years.map(async (year) => {
      const start = new Date(year, 0, 1).getTime() / 1000; // Jan 1st
      const end = new Date(year, 11, 31, 23, 59, 59, 999).getTime() / 1000; // Dec 31st

      console.log(`[fetchLast5YearsGridImport] Fetching year ${year}:`, new Date(start * 1000).toISOString());

      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'months', undefined, start.toString(), end.toString())
      );

      const records = stats.records;

      // Sum all grid_history_from values for the year
      let yearlyGridImport = 0;
      if (records.grid_history_from && Array.isArray(records.grid_history_from)) {
        yearlyGridImport = records.grid_history_from.reduce((sum, item) => sum + (item[1] || 0), 0);
      }

      console.log(`[fetchLast5YearsGridImport] Year ${year} grid import:`, yearlyGridImport);

      return {
        year: year.toString(),
        gridImport: yearlyGridImport,
      };
    })
  );

  return results;
}
