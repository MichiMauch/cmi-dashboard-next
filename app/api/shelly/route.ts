/**
 * Shelly API Route
 * Fetches temperature and humidity data from Shelly H&T Gen3 sensors
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchShellySensors, getShellyDeviceIds } from '@/lib/shelly';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const deviceIds = getShellyDeviceIds();

    if (deviceIds.length === 0) {
      return NextResponse.json(
        { error: 'No Shelly device IDs configured' },
        { status: 400 }
      );
    }

    const sensors = await fetchShellySensors(deviceIds);
    return NextResponse.json({ sensors });
  } catch (error) {
    console.error('[Shelly API] Error fetching sensor data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
