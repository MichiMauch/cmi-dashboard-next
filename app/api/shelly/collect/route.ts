/**
 * Shelly Data Collection Cron Endpoint
 * Runs every 2 hours to collect and store sensor readings
 */

import { NextResponse } from 'next/server';
import { fetchShellySensors, getShellyDeviceIds, saveAllReadings } from '@/lib/shelly';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const deviceIds = getShellyDeviceIds();

    if (deviceIds.length === 0) {
      return NextResponse.json(
        { error: 'No Shelly device IDs configured' },
        { status: 400 }
      );
    }

    console.log(`[Shelly Collect] Fetching data for ${deviceIds.length} device(s)...`);

    const sensors = await fetchShellySensors(deviceIds);
    const savedCount = await saveAllReadings(sensors);

    console.log(`[Shelly Collect] Saved ${savedCount} new reading(s)`);

    return NextResponse.json({
      success: true,
      devicesChecked: sensors.length,
      readingsSaved: savedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Shelly Collect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
