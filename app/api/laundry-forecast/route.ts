/**
 * Laundry Forecast API Route
 * Uses OpenAI to analyze weather data and recommend best day to hang laundry
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ProcessedWeatherData } from '@/types/weather';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
}

/**
 * Filter hourly forecast data to only include daytime hours (06:00-18:00)
 */
function filterDaytimeHours(hourly: any[]) {
  return hourly.filter((hour) => {
    const time = hour.time.split(':')[0];
    const hourNum = parseInt(time, 10);
    return hourNum >= 6 && hourNum <= 18;
  });
}

/**
 * Prepare weather data for AI analysis
 */
function prepareWeatherDataForAI(weatherData: ProcessedWeatherData) {
  const dailyForecasts = weatherData.daily.map((day, index) => {
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
    // Check API key
    if (!OPENAI_API_KEY) {
      console.error('[LaundryForecast] OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured in environment variables' },
        { status: 500 }
      );
    }

    console.log('[LaundryForecast] Fetching weather data...');

    // Fetch weather data from our weather API
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'cmi-dashboard-next.vercel.app'}`
      : 'http://localhost:3000';

    const weatherUrl = `${baseUrl}/api/weather`;
    console.log('[LaundryForecast] Fetching from:', weatherUrl);

    let weatherResponse;
    try {
      weatherResponse = await fetch(weatherUrl, {
        next: { revalidate: 600 },
      });
    } catch (fetchError) {
      console.error('[LaundryForecast] Weather fetch error:', fetchError);
      throw new Error(`Failed to fetch weather data: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`);
    }

    console.log('[LaundryForecast] Weather response status:', weatherResponse.status);

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text().catch(() => 'No error details');
      console.error('[LaundryForecast] Weather API error response:', errorText);
      throw new Error(`Weather API returned ${weatherResponse.status}: ${errorText}`);
    }

    const weatherData: ProcessedWeatherData = await weatherResponse.json();
    console.log('[LaundryForecast] Weather data received successfully');

    // Prepare data for AI
    const forecastData = prepareWeatherDataForAI(weatherData);

    console.log('[LaundryForecast] Sending data to OpenAI...');

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Create prompt for AI
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

    // Call OpenAI API
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }, // Force JSON output
        temperature: 0.7,
      });
      console.log('[LaundryForecast] OpenAI response received');
    } catch (aiError) {
      console.error('[LaundryForecast] OpenAI error:', aiError);
      throw new Error(`OpenAI API call failed: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}`);
    }

    // Extract and parse response
    const responseText = completion.choices[0]?.message?.content || '';
    console.log('[LaundryForecast] Raw AI response:', responseText);

    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    let forecast: LaundryForecast;
    try {
      forecast = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[LaundryForecast] Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    console.log('[LaundryForecast] Forecast generated successfully');

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('[LaundryForecast] Error generating forecast:', error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('[LaundryForecast] Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
