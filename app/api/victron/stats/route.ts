/**
 * Victron Stats API Route
 * Fetches live or historical stats from Victron VRM API
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchVictronStats, processSolarData } from '@/lib/victron';
import { fetchWithTokenRefresh } from '@/lib/victron-token';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const interval = searchParams.get('interval') || '15mins';
    const type = searchParams.get('type') || 'live_feed';
    const start = searchParams.get('start') || undefined;

    const installationId = process.env.VICTRON_INSTALLATION_ID;

    if (!installationId) {
      return NextResponse.json(
        { error: 'VICTRON_INSTALLATION_ID not configured' },
        { status: 500 }
      );
    }

    // Fetch data with automatic token refresh
    const stats = await fetchWithTokenRefresh((token) =>
      fetchVictronStats(installationId, token, interval, type, start)
    );

    // Process data for easier consumption
    const processedData = processSolarData(stats);

    return NextResponse.json({
      raw: stats, // Full raw data
      processed: processedData, // Processed/simplified data
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Victron API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Victron data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
