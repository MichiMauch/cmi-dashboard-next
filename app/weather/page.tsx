/**
 * Weather Page
 * Displays current weather and forecast for Muhen
 */

import { Container, Typography, Box, Card, CardContent } from '@mui/material';
import { StatCard } from '@/components/shared/stat-card';
import { MetricCard } from '@/components/shared/metric-card';
import { ChartCard } from '@/components/shared/chart-card';
import { LineChart } from '@mui/x-charts/LineChart';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CompressIcon from '@mui/icons-material/Compress';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import type { ProcessedWeatherData } from '@/types/weather';

export const revalidate = 600; // Revalidate every 10 minutes

/**
 * Get weather icon based on OpenWeather icon code
 */
function getWeatherIcon(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Format time from unix timestamp
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Fetch weather data
 */
async function getWeatherData(): Promise<ProcessedWeatherData | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/weather`, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      console.error('[WeatherPage] Failed to fetch weather data:', response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[WeatherPage] Error fetching weather data:', error);
    return null;
  }
}

export default async function WeatherPage() {
  const weatherData = await getWeatherData();

  if (!weatherData) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            ⚠️ Wetterdaten nicht verfügbar
          </Typography>
          <Typography color="text.secondary" paragraph>
            Die Wetterdaten konnten nicht geladen werden. Bitte prüfe die API-Konfiguration.
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
              borderRadius: 1,
              fontSize: '0.875rem',
            }}
          >
            Stelle sicher, dass OPENWEATHER_API_KEY in den Umgebungsvariablen gesetzt ist.
          </Box>
        </Box>
      </Container>
    );
  }

  const { current, hourly, daily, location } = weatherData;

  // Prepare hourly chart data
  const hourlyChartData = hourly.map((h) => ({
    time: h.time,
    temp: h.temp,
  }));

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
          >
            🌤️ Wetter in {location.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Letztes Update: {new Date(weatherData.timestamp).toLocaleString('de-DE')}
          </Typography>
        </Box>

        {/* Current Weather Hero Card */}
        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  component="img"
                  src={getWeatherIcon(current.icon)}
                  alt={current.weatherDescription}
                  sx={{ width: 100, height: 100 }}
                />
                <Box>
                  <Typography variant="h2" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {current.temp}°C
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Gefühlt {current.feelsLike}°C
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                <Typography variant="h5" gutterBottom sx={{ textTransform: 'capitalize' }}>
                  {current.weatherDescription}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bewölkung: {current.clouds}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Current Conditions */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <StatCard
            title="Wind"
            value={`${current.windSpeed} km/h`}
            subtitle={current.windDirection}
            icon={<AirIcon />}
            color="info"
          />
          <StatCard
            title="Luftfeuchtigkeit"
            value={`${current.humidity}%`}
            icon={<WaterDropIcon />}
            color="primary"
          />
          <StatCard
            title="Luftdruck"
            value={`${current.pressure} hPa`}
            icon={<CompressIcon />}
            color="secondary"
          />
          <StatCard
            title="Sichtweite"
            value={`${(current.visibility / 1000).toFixed(1)} km`}
            icon={<WbSunnyIcon />}
            color="warning"
          />
        </Box>

        {/* Sun Times */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <StatCard
            title="Sonnenaufgang"
            value={formatTime(current.sunrise)}
            icon={<WbTwilightIcon />}
            color="warning"
          />
          <StatCard
            title="Sonnenuntergang"
            value={formatTime(current.sunset)}
            icon={<NightsStayIcon />}
            color="error"
          />
        </Box>

        {/* Hourly Forecast Chart */}
        {hourly.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <ChartCard title="Stündliche Vorhersage (Heute)" height={300}>
              <LineChart
                dataset={hourlyChartData}
                xAxis={[
                  {
                    scaleType: 'band',
                    dataKey: 'time',
                    tickLabelStyle: { fontSize: 10 },
                  },
                ]}
                series={[
                  {
                    dataKey: 'temp',
                    label: 'Temperatur (°C)',
                    color: '#3b82f6',
                    showMark: true,
                  },
                ]}
                height={300}
              />
            </ChartCard>
          </Box>
        )}

        {/* 5-Day Forecast */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            📅 5-Tage Vorhersage
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
              gap: 3,
            }}
          >
            {daily.map((day, index) => (
              <Card key={index} elevation={2}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    {day.dayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" align="center" display="block" gutterBottom>
                    {day.date}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      my: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={getWeatherIcon(day.icon)}
                      alt={day.weatherDescription}
                      sx={{ width: 64, height: 64 }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      sx={{ textTransform: 'capitalize', mt: 1 }}
                    >
                      {day.weatherDescription}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                      {day.tempMax}°
                    </Typography>
                    <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                      {day.tempMin}°
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                    💧 {day.pop}% | 💨 {day.windSpeed} km/h
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
