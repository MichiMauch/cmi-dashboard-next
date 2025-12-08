/**
 * Shelly History All API
 * Returns historical sensor readings for all rooms combined
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalReadings, getAggregatedReadings } from '@/lib/shelly';
import { SHELLY_ROOMS } from '@/lib/shelly-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year' | null;

    if (!period || !['day', 'week', 'month', 'year'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period parameter. Use: day, week, month, or year' },
        { status: 400 }
      );
    }

    // Fetch data for all rooms in parallel
    const roomsData = await Promise.all(
      SHELLY_ROOMS.map(async (room) => {
        try {
          if (period === 'day' || period === 'week') {
            const readings = await getHistoricalReadings(room.deviceId, period);
            return {
              deviceId: room.deviceId,
              name: room.name,
              slug: room.slug,
              readings,
            };
          } else {
            const readings = await getAggregatedReadings(room.deviceId, period);
            return {
              deviceId: room.deviceId,
              name: room.name,
              slug: room.slug,
              readings,
            };
          }
        } catch (error) {
          console.error(`[Shelly History All API] Error fetching ${room.name}:`, error);
          return {
            deviceId: room.deviceId,
            name: room.name,
            slug: room.slug,
            readings: [],
          };
        }
      })
    );

    return NextResponse.json({ rooms: roomsData, period });
  } catch (error) {
    console.error('[Shelly History All API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
