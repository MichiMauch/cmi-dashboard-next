/**
 * Solar Peak Power API Route
 * Returns the peak solar power for today
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchVictronStats } from '@/lib/victron';
import { fetchWithTokenRefresh } from '@/lib/victron-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No caching for real-time data

/**
 * Get timestamp for the beginning of today (midnight)
 */
function getTimestampForToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor(today.getTime() / 1000); // Return seconds
}

export async function GET(request: NextRequest) {
  try {
    const installationId = process.env.VICTRON_INSTALLATION_ID;

    if (!installationId) {
      return NextResponse.json(
        { error: 'VICTRON_INSTALLATION_ID not configured' },
        { status: 500 }
      );
    }

    const start = getTimestampForToday();
    const end = Math.floor(Date.now() / 1000); // Current time in seconds
    console.log('[PeakAPI] Fetching peak power for today starting at:', new Date(start * 1000).toISOString());

    // Fetch today's data with 15-minute intervals
    const stats = await fetchWithTokenRefresh((token) =>
      fetchVictronStats(installationId, token, '15mins', undefined, start.toString(), end.toString())
    );

    const records = stats.records;

    // Find the highest Pdc (solar power) value for the day
    if (!records.Pdc || !Array.isArray(records.Pdc) || records.Pdc.length === 0) {
      console.log('[PeakAPI] No Pdc data available');
      return NextResponse.json({
        timestamp: start,
        peak_power: 0,
      });
    }

    const peakPowerEntry = records.Pdc.reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      [0, 0]
    );

    const peakTimestamp = peakPowerEntry[0];
    const peakPower = peakPowerEntry[1];

    console.log('[PeakAPI] Peak power found:', peakPower, 'W at', new Date(peakTimestamp * 1000).toISOString());

    return NextResponse.json({
      timestamp: peakTimestamp,
      peak_power: peakPower,
    });
  } catch (error) {
    console.error('[PeakAPI] Error fetching peak power:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch peak power data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
