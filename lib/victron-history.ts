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
        fetchVictronStats(INSTALLATION_ID, token, '15mins', 'live_feed', start.toString())
      );

      console.log('[fetchLast7Days] Response keys:', Object.keys(stats.records));
      console.log('[fetchLast7Days] Sample data:', {
        total_solar_yield: stats.records.total_solar_yield,
        total_consumption: stats.records.total_consumption,
        Pdc: stats.records.Pdc ? `${stats.records.Pdc.length} entries` : 'missing',
      });

      const records = stats.records;

      // Calculate peak power for the day
      let peakPower = 0;
      if (records.Pdc && Array.isArray(records.Pdc) && records.Pdc.length > 0) {
        peakPower = Math.max(...records.Pdc.map((item) => item[1]));
      }

      // Calculate deltas for cumulative values (end - start of day)
      let totalSolarYield = 0;
      let totalConsumption = 0;
      let totalEnergyImported = 0;
      let totalEnergyExported = 0;

      if (records.total_solar_yield && Array.isArray(records.total_solar_yield) && records.total_solar_yield.length > 0) {
        const firstValue = records.total_solar_yield[0][1];
        const lastValue = records.total_solar_yield[records.total_solar_yield.length - 1][1];
        totalSolarYield = lastValue - firstValue;
      }

      if (records.total_consumption && Array.isArray(records.total_consumption) && records.total_consumption.length > 0) {
        const firstValue = records.total_consumption[0][1];
        const lastValue = records.total_consumption[records.total_consumption.length - 1][1];
        totalConsumption = lastValue - firstValue;
      }

      if (records.total_energy_imported && Array.isArray(records.total_energy_imported) && records.total_energy_imported.length > 0) {
        const firstValue = records.total_energy_imported[0][1];
        const lastValue = records.total_energy_imported[records.total_energy_imported.length - 1][1];
        totalEnergyImported = lastValue - firstValue;
      }

      if (records.total_energy_exported && Array.isArray(records.total_energy_exported) && records.total_energy_exported.length > 0) {
        const firstValue = records.total_energy_exported[0][1];
        const lastValue = records.total_energy_exported[records.total_energy_exported.length - 1][1];
        totalEnergyExported = lastValue - firstValue;
      }

      // Calculate average power from Pdc values
      let averagePower = 0;
      if (records.Pdc && Array.isArray(records.Pdc) && records.Pdc.length > 0) {
        const sum = records.Pdc.reduce((acc, item) => acc + item[1], 0);
        averagePower = sum / records.Pdc.length;
      }

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

      // Fetch data for the entire month using live_feed
      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'days', 'live_feed', start.toString())
      );

      console.log('[fetchLast24Months] Response keys:', Object.keys(stats.records));
      console.log('[fetchLast24Months] total_solar_yield:', stats.records?.total_solar_yield);
      console.log('[fetchLast24Months] total_consumption:', stats.records?.total_consumption);
      console.log('[fetchLast24Months] grid_history_from:', stats.records?.grid_history_from);

      const records = stats.records;

      // Calculate deltas for cumulative values (end - start of month)
      let totalSolarYield = 0;
      let totalConsumption = 0;
      let gridHistoryFrom = 0;

      if (records.total_solar_yield && Array.isArray(records.total_solar_yield) && records.total_solar_yield.length > 0) {
        const firstValue = records.total_solar_yield[0][1];
        const lastValue = records.total_solar_yield[records.total_solar_yield.length - 1][1];
        totalSolarYield = lastValue - firstValue;
      }

      if (records.total_consumption && Array.isArray(records.total_consumption) && records.total_consumption.length > 0) {
        const firstValue = records.total_consumption[0][1];
        const lastValue = records.total_consumption[records.total_consumption.length - 1][1];
        totalConsumption = lastValue - firstValue;
      }

      if (records.grid_history_from && Array.isArray(records.grid_history_from) && records.grid_history_from.length > 0) {
        const firstValue = records.grid_history_from[0][1];
        const lastValue = records.grid_history_from[records.grid_history_from.length - 1][1];
        gridHistoryFrom = lastValue - firstValue;
      }

      return {
        timestamp: start,
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
      const stats = await fetchWithTokenRefresh((token) =>
        fetchVictronStats(INSTALLATION_ID, token, 'days', 'live_feed', start.toString())
      );

      console.log('[fetchAutarkieStats] Month response keys:', Object.keys(stats.records));

      const records = stats.records;

      // Calculate deltas for cumulative values (end - start of month)
      let monthSolarYield = 0;
      let monthConsumption = 0;
      let monthGridHistoryFrom = 0;

      if (records.total_solar_yield && Array.isArray(records.total_solar_yield) && records.total_solar_yield.length > 0) {
        const firstValue = records.total_solar_yield[0][1];
        const lastValue = records.total_solar_yield[records.total_solar_yield.length - 1][1];
        monthSolarYield = lastValue - firstValue;
      }

      if (records.total_consumption && Array.isArray(records.total_consumption) && records.total_consumption.length > 0) {
        const firstValue = records.total_consumption[0][1];
        const lastValue = records.total_consumption[records.total_consumption.length - 1][1];
        monthConsumption = lastValue - firstValue;
      }

      if (records.grid_history_from && Array.isArray(records.grid_history_from) && records.grid_history_from.length > 0) {
        const firstValue = records.grid_history_from[0][1];
        const lastValue = records.grid_history_from[records.grid_history_from.length - 1][1];
        monthGridHistoryFrom = lastValue - firstValue;
      }

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
        fetchVictronStats(INSTALLATION_ID, token, '15mins', 'live_feed', start.toString())
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
        timestamp: peakPowerEntry[0] * 1000, // Convert to milliseconds
        peak_power: peakPowerEntry[1],
      };
    })
  );

  return results;
}
