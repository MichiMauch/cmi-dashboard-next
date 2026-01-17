/**
 * Grid Detection Module
 * 3-layer detection system for determining grid connection status
 */

import { GridStatus } from '@/types/victron';
import gridPeriodsData from './grid-periods.json';

// Threshold for grid power detection (Watts)
const PG_THRESHOLD = 50;

interface GridPeriod {
  gridOn: string;
  gridOff: string | null;
}

interface GridPeriodsConfig {
  periods: GridPeriod[];
}

/**
 * Layer 1: Detect grid status from Pg (Grid Power) field
 * Most reliable method when available
 *
 * @param pgValue - Current grid power in Watts (positive = consuming, negative = feeding)
 * @returns GridStatus or null if Pg is not available/valid
 */
export function detectFromPgField(pgValue: number | undefined | null): GridStatus | null {
  if (pgValue === undefined || pgValue === null) {
    return null;
  }

  if (pgValue > PG_THRESHOLD) {
    console.log(`[detectFromPgField] GRID_CONSUMING (Pg=${pgValue.toFixed(1)}W)`);
    return 'grid_consuming';
  }

  if (pgValue < -PG_THRESHOLD) {
    console.log(`[detectFromPgField] GRID_FEEDING (Pg=${pgValue.toFixed(1)}W)`);
    return 'grid_feeding';
  }

  console.log(`[detectFromPgField] AUTARK (Pg=${pgValue.toFixed(1)}W within threshold)`);
  return 'autark';
}

/**
 * Layer 2: Detect grid status from grid_history_from data
 * Fallback when Pg is not available
 *
 * @param gridHistoryData - Array of grid history data points
 * @returns GridStatus or null if data is insufficient
 */
export function detectFromGridHistory(
  gridHistoryData: Array<[number, number, number, number]> | undefined
): GridStatus | null {
  if (!gridHistoryData || !Array.isArray(gridHistoryData) || gridHistoryData.length < 3) {
    return null;
  }

  const recentPoints = gridHistoryData.slice(-10);
  const firstValue = recentPoints[0][1] || 0;
  const lastValue = recentPoints[recentPoints.length - 1][1] || 0;
  const previousValue = recentPoints[recentPoints.length - 2]?.[1] || 0;

  const recentIncrease = lastValue > previousValue;
  const overallIncrease = lastValue > firstValue;

  console.log('[detectFromGridHistory]', {
    first: firstValue.toFixed(6),
    previous: previousValue.toFixed(6),
    last: lastValue.toFixed(6),
    recentIncrease,
    overallIncrease
  });

  if (recentIncrease || overallIncrease) {
    console.log('[detectFromGridHistory] GRID_CONSUMING (history increasing)');
    return 'grid_consuming';
  }

  // If no increase detected, we can't definitively say it's autark
  // Return null to let other layers decide
  return null;
}

/**
 * Layer 3: Detect grid status from manual grid-periods.json override
 * Used when system is physically disconnected from grid
 *
 * @param date - Date to check (defaults to now)
 * @returns GridStatus based on configured periods
 */
export function detectFromGridPeriods(date: Date = new Date()): GridStatus {
  const config = gridPeriodsData as GridPeriodsConfig;
  const checkDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Find the applicable period for the given date
  for (const period of config.periods) {
    const gridOnDate = period.gridOn;
    const gridOffDate = period.gridOff;

    // Check if date is within this period
    if (checkDate >= gridOnDate) {
      if (gridOffDate === null) {
        // Grid is still connected (gridOff not set)
        console.log(`[detectFromGridPeriods] GRID_CONSUMING (gridOff=null, connected since ${gridOnDate})`);
        return 'grid_consuming';
      }

      if (checkDate >= gridOffDate) {
        // Grid has been disconnected
        console.log(`[detectFromGridPeriods] AUTARK (disconnected since ${gridOffDate})`);
        return 'autark';
      }

      // Date is between gridOn and gridOff
      console.log(`[detectFromGridPeriods] GRID_CONSUMING (between ${gridOnDate} and ${gridOffDate})`);
      return 'grid_consuming';
    }
  }

  // No matching period found, assume unknown
  console.log('[detectFromGridPeriods] UNKNOWN (no matching period)');
  return 'unknown';
}

/**
 * Main grid detection function - cascades through all detection layers
 *
 * Priority:
 * 1. Pg field (real-time grid power measurement)
 * 2. grid_history_from (cumulative grid consumption)
 * 3. grid-periods.json (manual override)
 *
 * @param pgValue - Current grid power in Watts
 * @param gridHistoryData - Array of grid history data points
 * @returns Detected GridStatus with detection method logged
 */
export function detectGridStatus(
  pgValue: number | undefined | null,
  gridHistoryData?: Array<[number, number, number, number]>
): GridStatus {
  console.log('[detectGridStatus] Starting detection cascade...');

  // Layer 1: Try Pg field first (most reliable)
  const pgResult = detectFromPgField(pgValue);
  if (pgResult !== null) {
    console.log(`[detectGridStatus] Result from Layer 1 (Pg): ${pgResult}`);
    return pgResult;
  }

  // Layer 2: Try grid history
  const historyResult = detectFromGridHistory(gridHistoryData);
  if (historyResult !== null) {
    console.log(`[detectGridStatus] Result from Layer 2 (grid_history): ${historyResult}`);
    return historyResult;
  }

  // Layer 3: Use manual grid periods as final fallback
  const periodsResult = detectFromGridPeriods();
  console.log(`[detectGridStatus] Result from Layer 3 (grid-periods.json): ${periodsResult}`);
  return periodsResult;
}
