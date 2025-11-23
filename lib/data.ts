/**
 * Data fetching utilities for dashboard
 */

import { DashboardData } from '@/types/dashboard';
import { unstable_cache } from 'next/cache';

// Fixed URL where the latest dashboard data is always available
const DASHBOARD_DATA_URL = 'https://rpvkpagfoklausud.public.blob.vercel-storage.com/dashboard-data.json';

/**
 * Fetch dashboard data from Vercel Blob Storage
 * Cached with 5 minute revalidation
 */
export const getDashboardData = unstable_cache(
  async (): Promise<DashboardData> => {
    try {
      console.log('[getDashboardData] Fetching from:', DASHBOARD_DATA_URL);

      // Fetch directly from the fixed URL
      const response = await fetch(DASHBOARD_DATA_URL, {
        cache: 'no-store', // Always get fresh data
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[getDashboardData] Data fetched successfully, last_updated:', data.last_updated);

      return data as DashboardData;
    } catch (error) {
      console.error('[getDashboardData] Error fetching dashboard data:', error);

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
    revalidate: 300, // Revalidate every 5 minutes
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
