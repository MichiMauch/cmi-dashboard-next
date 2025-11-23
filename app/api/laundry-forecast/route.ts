/**
 * Laundry Forecast API Route
 * Uses Google Gemini AI to analyze weather data and recommend best day to hang laundry
 */

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { ProcessedWeatherData } from '@/types/weather';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

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
    if (!GOOGLE_AI_API_KEY) {
      console.error('[LaundryForecast] GOOGLE_AI_API_KEY not configured');
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY not configured in environment variables' },
        { status: 500 }
      );
    }

    console.log('[LaundryForecast] Fetching weather data...');

    // Fetch weather data from our weather API
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'cmi-dashboard-next.vercel.app'}`
      : 'http://localhost:3000';

    const weatherResponse = await fetch(`${baseUrl}/api/weather`, {
      next: { revalidate: 600 },
    });

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData: ProcessedWeatherData = await weatherResponse.json();
    console.log('[LaundryForecast] Weather data received');

    // Prepare data for AI
    const forecastData = prepareWeatherDataForAI(weatherData);

    console.log('[LaundryForecast] Sending data to Gemini AI...');

    // Initialize Google Gemini AI
    const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

    // Create prompt for AI
    const prompt = `Du bist ein Wetter-Experte. Analysiere die folgenden 5-Tage Wettervorhersagen und empfehle den BESTEN Tag zum Wäsche draussen aufhängen.

WICHTIGE KRITERIEN (in dieser Reihenfolge):
1. KEIN oder sehr wenig Regen (niedrige Regenwahrscheinlichkeit)
2. NIEDRIGE Luftfeuchtigkeit (für schnelles Trocknen)
3. Moderate Windgeschwindigkeit (nicht zu stark)
4. Angenehme Temperatur

ZEITFENSTER: Nur zwischen 06:00 und 18:00 Uhr relevant (nicht nachts).

WETTERDATEN:
${JSON.stringify(forecastData, null, 2)}

ANTWORTE NUR mit einem JSON-Objekt in diesem exakten Format (keine zusätzlichen Texte):
{
  "bestDay": {
    "date": "DD.MM",
    "dayName": "Wochentag",
    "timeWindow": "Empfohlenes Zeitfenster z.B. 08:00-16:00"
  },
  "reasoning": "Kurze Begründung (1-2 Sätze) warum dieser Tag am besten ist",
  "weatherSummary": {
    "temperature": "Min-Max Temperatur",
    "humidity": "Luftfeuchtigkeit in %",
    "rain": "Regenwahrscheinlichkeit in %"
  }
}`;

    // Call Gemini AI
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    console.log('[LaundryForecast] AI response received');

    // Extract and parse response
    const responseText = result.text || '';
    console.log('[LaundryForecast] Raw AI response:', responseText);

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Try to extract JSON from response (in case AI added extra text)
    let forecast: LaundryForecast;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      forecast = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('[LaundryForecast] Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    console.log('[LaundryForecast] Forecast generated successfully');

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('[LaundryForecast] Error generating forecast:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
