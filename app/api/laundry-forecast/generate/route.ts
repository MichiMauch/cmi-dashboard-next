/**
 * Generate Laundry Forecast API Route
 * Fetches weather, calls OpenAI, saves result to Vercel Blob
 * Triggered by Cron (daily 6am) or manual refresh button
 */

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import OpenAI from 'openai';
import type { ProcessedWeatherData } from '@/types/weather';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

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

/**
 * Prepare weather data for AI analysis
 */
function prepareWeatherDataForAI(weatherData: ProcessedWeatherData) {
  const dailyForecasts = weatherData.daily.map((day) => {
    return {
      day: day.dayName,
      date: day.date,
      tempMin: day.tempMin,
      tempMax: day.tempMax,
      humidity: day.humidity,
      rainProbability: day.pop,
      windSpeed: day.windSpeed,
      weather: day.weatherDescription,
    };
  });

  return dailyForecasts;
}

export async function GET() {
  try {
    console.log('[GenerateForecast] Starting forecast generation...');

    // Check API keys
    if (!OPENAI_API_KEY) {
      console.error('[GenerateForecast] OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!BLOB_READ_WRITE_TOKEN) {
      console.error('[GenerateForecast] BLOB_READ_WRITE_TOKEN not configured');
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Fetch weather data
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'cmi-dashboard-next.vercel.app'}`
      : 'http://localhost:3000';

    const weatherUrl = `${baseUrl}/api/weather`;
    console.log('[GenerateForecast] Fetching weather from:', weatherUrl);

    const weatherResponse = await fetch(weatherUrl, {
      cache: 'no-store',
    });

    if (!weatherResponse.ok) {
      throw new Error(`Weather API returned ${weatherResponse.status}`);
    }

    const weatherData: ProcessedWeatherData = await weatherResponse.json();
    console.log('[GenerateForecast] Weather data received');

    // Prepare data for AI
    const forecastData = prepareWeatherDataForAI(weatherData);

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const systemPrompt = `Du bist ein Wetter-Experte. Bewerte ALLE Tage zum Wäsche draussen aufhängen nach einem strikten Scoring-System.

BEWERTUNGSFORMEL (streng einhalten!):
Score = (100 - Regenwahrscheinlichkeit %) × 2 + (100 - Luftfeuchtigkeit %) × 1

WICHTIG: Der Tag mit dem HÖCHSTEN Score ist der BESTE Tag!

BEISPIELE:
- Tag A: 0% Regen, 83% Luftf. → Score = (100-0)×2 + (100-83)×1 = 200 + 17 = 217
- Tag B: 20% Regen, 97% Luftf. → Score = (100-20)×2 + (100-97)×1 = 160 + 3 = 163
→ Tag A ist BESSER (höherer Score)

PRIORITÄT (nach Wichtigkeit):
1. **REGEN** - Je niedriger, desto besser (wichtigster Faktor!)
2. **LUFTFEUCHTIGKEIT** - Je niedriger, desto schneller trocknet Wäsche
3. Temperatur - Nur relevant bei sonst gleichen Bedingungen

ZEITFENSTER: Nur 06:00-18:00 Uhr relevant.

RATING basierend auf Score:
- "excellent": Score ≥ 210 (z.B. 0-10% Regen UND < 70% Luftf.)
- "good": Score 180-209 (z.B. 0-25% Regen UND < 80% Luftf.)
- "fair": Score 150-179 (z.B. 25-50% Regen ODER 80-85% Luftf.)
- "poor": Score < 150 (> 50% Regen ODER > 85% Luftf.)

ANTWORTE NUR mit einem JSON-Objekt in diesem exakten Format:
{
  "bestDay": {
    "date": "DD.MM",
    "dayName": "Wochentag",
    "timeWindow": "Empfohlenes Zeitfenster z.B. 08:00-16:00"
  },
  "reasoning": "Kurze Begründung (1-2 Sätze) warum dieser Tag am besten ist",
  "weatherSummary": {
    "temperature": "Min-Max Temperatur vom besten Tag",
    "humidity": "Luftfeuchtigkeit in %",
    "rain": "Regenwahrscheinlichkeit in %"
  },
  "allDays": [
    {
      "dayName": "Wochentag",
      "date": "DD.MM",
      "rating": "excellent/good/fair/poor",
      "temperature": "Min-Max in °C",
      "humidity": 65,
      "rainProbability": 20,
      "reason": "Kurze Begründung für diesen Tag (1 Satz)"
    }
  ]
}`;

    const userPrompt = `WETTERDATEN für die nächsten 5 Tage:
${JSON.stringify(forecastData, null, 2)}

AUFGABE:
1. Berechne für JEDEN Tag den Score: (100 - rainProbability) × 2 + (100 - humidity) × 1
2. Wähle den Tag mit dem HÖCHSTEN Score als bestDay
3. Gib ALLE 5 Tage zurück, sortiert nach Datum (nicht nach Score!)
4. Vergebe rating basierend auf Score (siehe System-Prompt)

WICHTIG: Bei gleicher Regenwahrscheinlichkeit gewinnt der Tag mit niedrigerer Luftfeuchtigkeit!`;

    console.log('[GenerateForecast] Calling OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    const forecast: LaundryForecast = JSON.parse(responseText);

    // Add metadata
    forecast.generated_at = new Date().toISOString();
    // Next update: tomorrow at 6am
    const nextUpdate = new Date();
    nextUpdate.setDate(nextUpdate.getDate() + 1);
    nextUpdate.setHours(6, 0, 0, 0);
    forecast.next_update = nextUpdate.toISOString();

    console.log('[GenerateForecast] Forecast generated successfully');

    // Save to Vercel Blob
    const blob = await put('laundry-forecast.json', JSON.stringify(forecast, null, 2), {
      access: 'public',
      addRandomSuffix: false, // Always overwrite same file
    });

    console.log('[GenerateForecast] Saved to Blob:', blob.url);

    return NextResponse.json({
      success: true,
      message: 'Forecast generated and saved',
      blob_url: blob.url,
      generated_at: forecast.generated_at,
      next_update: forecast.next_update,
    });

  } catch (error) {
    console.error('[GenerateForecast] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
