/**
 * Shelly History API
 * Returns historical sensor readings for charts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalReadings, getAggregatedReadings } from '@/lib/shelly';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year' | null;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId parameter' },
        { status: 400 }
      );
    }

    if (!period || !['day', 'week', 'month', 'year'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period parameter. Use: day, week, month, or year' },
        { status: 400 }
      );
    }

    // For day/week: return all readings
    // For month/year: return aggregated daily/monthly averages
    if (period === 'day' || period === 'week') {
      const readings = await getHistoricalReadings(deviceId, period);
      return NextResponse.json({ readings, period, deviceId });
    } else {
      const aggregated = await getAggregatedReadings(deviceId, period);
      return NextResponse.json({ readings: aggregated, period, deviceId, aggregated: true });
    }
  } catch (error) {
    console.error('[Shelly History API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
