/**
 * Victron Stats API Route
 * Fetches live or historical stats from Victron VRM API
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchVictronStats, processSolarData } from '@/lib/victron';
import { fetchWithTokenRefresh } from '@/lib/victron-token';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Victron stats request received');
    const { searchParams } = new URL(request.url);

    const interval = searchParams.get('interval') || '15mins';
    const type = searchParams.get('type') || undefined;
    const start = searchParams.get('start') || undefined;

    const installationId = process.env.VICTRON_INSTALLATION_ID;
    console.log('[API] Installation ID:', installationId ? 'SET' : 'NOT SET');

    if (!installationId) {
      return NextResponse.json(
        { error: 'VICTRON_INSTALLATION_ID not configured' },
        { status: 500 }
      );
    }

    console.log('[API] Fetching stats with params:', { interval, type, start });

    // Fetch data with automatic token refresh
    const stats = await fetchWithTokenRefresh((token) =>
      fetchVictronStats(installationId, token, interval, type, start)
    );

    console.log('[API] Stats fetched successfully');
    console.log('[API] Raw records keys:', Object.keys(stats.records));
    console.log('[API] Sample Pdc data:', stats.records.Pdc?.slice(-2));
    console.log('[API] Sample bs data:', stats.records.bs?.slice(-2));
    console.log('[API] Sample Pac data:', stats.records.Pac?.slice(-2));
    console.log('[API] Sample Pg data:', stats.records.Pg?.slice(-2));
    console.log('[API] Sample Pb data:', stats.records.Pb?.slice(-2));

    // Process data for easier consumption
    const processedData = processSolarData(stats);

    return NextResponse.json({
      raw: stats, // Full raw data
      processed: processedData, // Processed/simplified data
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Victron API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Victron data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
