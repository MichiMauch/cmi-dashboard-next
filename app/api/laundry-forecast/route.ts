/**
 * Laundry Forecast API Route
 * Reads pre-generated forecast from Vercel Blob Storage
 * Forecast is generated daily at 6am or via manual refresh
 */

import { NextResponse } from 'next/server';

interface DayForecast {
  dayName: string;
  date: string;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  temperature: string;
  humidity: number;
  rainProbability: number;
  reason: string;
}

interface LaundryForecast {
  bestDay: {
    date: string;
    dayName: string;
    timeWindow: string;
  };
  reasoning: string;
  weatherSummary: {
    temperature: string;
    humidity: string;
    rain: string;
  };
  allDays: DayForecast[];
  generated_at?: string;
  next_update?: string;
}

// Fixed URL where the forecast is stored
const FORECAST_BLOB_URL = 'https://rpvkpagfoklausud.public.blob.vercel-storage.com/laundry-forecast.json';

export async function GET() {
  try {
    console.log('[LaundryForecast] Fetching from Blob...');

    // Fetch from Blob Storage
    const response = await fetch(FORECAST_BLOB_URL, {
      cache: 'no-store', // Always get fresh data
    });

    if (!response.ok) {
      // If blob doesn't exist yet, return helpful message
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: 'Forecast not generated yet',
            message: 'Please trigger forecast generation via /api/laundry-forecast/generate'
          },
          { status: 404 }
        );
      }
      throw new Error(`Failed to fetch forecast: ${response.status}`);
    }

    const forecast: LaundryForecast = await response.json();

    console.log('[LaundryForecast] Forecast loaded successfully');
    console.log('[LaundryForecast] Generated at:', forecast.generated_at);
    console.log('[LaundryForecast] Next update:', forecast.next_update);

    return NextResponse.json(forecast, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error) {
    console.error('[LaundryForecast] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
