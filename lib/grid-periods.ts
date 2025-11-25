/**
 * Grid Periods Data Management
 * Tracks periods when the system was connected to the grid vs. autark
 */

import gridPeriodsData from './grid-periods.json';

export interface GridPeriod {
  gridOn: string;  // ISO date string (YYYY-MM-DD)
  gridOff: string | null;  // ISO date string or null if still on grid
}

export interface GridPeriodsData {
  periods: GridPeriod[];
}

/**
 * Get all grid periods from JSON file
 */
export function getGridPeriods(): GridPeriod[] {
  return (gridPeriodsData as GridPeriodsData).periods;
}

/**
 * Calculate number of days for a grid period
 * If gridOff is null, calculate days until today
 */
export function calculateDays(gridOn: string, gridOff: string | null): number {
  const startDate = new Date(gridOn);
  const endDate = gridOff ? new Date(gridOff) : new Date();

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if a period is currently active (still on grid)
 */
export function isActivePeriod(period: GridPeriod): boolean {
  return period.gridOff === null;
}
