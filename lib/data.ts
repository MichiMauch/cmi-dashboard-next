/**
 * Data fetching utilities for dashboard
 */

import { get } from '@vercel/blob';
import { DashboardData } from '@/types/dashboard';
import { unstable_cache } from 'next/cache';

const BLOB_URL = 'dashboard-data.json';

/**
 * Fetch dashboard data from Vercel Blob Storage
 * Cached with 60 minute revalidation
 */
export const getDashboardData = unstable_cache(
  async (): Promise<DashboardData> => {
    try {
      // Get the blob
      const blob = await get(BLOB_URL);

      if (!blob) {
        throw new Error('Dashboard data not found in blob storage');
      }

      // Download and parse JSON
      const response = await fetch(blob.url);
      const data = await response.json();

      return data as DashboardData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);

      // Return empty data structure as fallback
      return {
        current_temps: [],
        oven_state: {
          state: 'cold',
          last_updated: new Date().toISOString(),
        },
        fire_events: [],
        temperature_history: [],
        monthly_stats: [],
        last_updated: new Date().toISOString(),
      };
    }
  },
  ['dashboard-data'],
  {
    revalidate: 3600, // Revalidate every 60 minutes
    tags: ['dashboard'],
  }
);

/**
 * Get the most recent fire events (limited)
 */
export async function getRecentFireEvents(limit: number = 10) {
  const data = await getDashboardData();
  return data.fire_events.slice(0, limit);
}

/**
 * Get current oven temperature
 */
export async function getOvenTemperature() {
  const data = await getDashboardData();
  // Input 4 = Ofen
  const ovenTemp = data.current_temps.find(t => t.nummer === 4);
  return ovenTemp?.wert ?? null;
}
