/**
 * Shelly API Route
 * Fetches temperature and humidity data from Shelly H&T Gen3 sensors
 * Includes in-memory caching to prevent rate limiting (429 errors)
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchShellySensors, getShellyDeviceIds, ShellySensorData } from '@/lib/shelly';

export const dynamic = 'force-dynamic';

// In-memory cache for Shelly sensor data
const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache
let cachedData: { sensors: ShellySensorData[]; timestamp: number } | null = null;

export async function GET(request: NextRequest) {
  try {
    const deviceIds = getShellyDeviceIds();

    if (deviceIds.length === 0) {
      return NextResponse.json(
        { error: 'No Shelly device IDs configured' },
        { status: 400 }
      );
    }

    // Check if cached data is still valid
    const now = Date.now();
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION_MS) {
      console.log('[Shelly API] Returning cached data');
      return NextResponse.json({ sensors: cachedData.sensors });
    }

    // Fetch fresh data
    console.log('[Shelly API] Fetching fresh data from Shelly Cloud');
    const sensors = await fetchShellySensors(deviceIds);

    // Update cache
    cachedData = { sensors, timestamp: now };

    return NextResponse.json({ sensors });
  } catch (error) {
    console.error('[Shelly API] Error fetching sensor data:', error);

    // If we have cached data, return it even if expired (better than nothing)
    if (cachedData) {
      console.log('[Shelly API] Returning stale cached data due to error');
      return NextResponse.json({ sensors: cachedData.sensors });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
