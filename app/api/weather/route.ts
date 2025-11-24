/**
 * Weather API Route
 * Fetches current weather and forecast data from OpenWeather API
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherData } from '@/lib/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchWeatherData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Weather API] Error fetching weather data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
