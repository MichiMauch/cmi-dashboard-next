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
async function getWeatherData(): Promise<ProcessedWeatherData | { error: string } | null> {
  try {
    // Use absolute URL for production, relative for development
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'cmi-dashboard-next.vercel.app'}`
      : 'http://localhost:3000';

    console.log('[WeatherPage] Fetching from:', `${baseUrl}/api/weather`);

    const response = await fetch(`${baseUrl}/api/weather`, {
      next: { revalidate: 600 },
      cache: 'no-store', // Force fresh data for debugging
    });

    console.log('[WeatherPage] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('[WeatherPage] API error:', errorData);
      return errorData;
    }

    const data = await response.json();
    console.log('[WeatherPage] Data received successfully');
    return data;
  } catch (error) {
    console.error('[WeatherPage] Fetch error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default async function WeatherPage() {
  const weatherData = await getWeatherData();

  if (!weatherData || 'error' in weatherData) {
    const errorMessage = weatherData && 'error' in weatherData ? weatherData.error : 'Unbekannter Fehler';

    return (
      <Container maxWidth="md">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            ⚠️ Wetterdaten nicht verfügbar
          </Typography>
          <Typography color="text.secondary" paragraph>
            Die Wetterdaten konnten nicht geladen werden.
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'error.main',
              color: 'error.contrastText',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          >
            Fehler: {errorMessage}
          </Box>
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
            <strong>Mögliche Ursachen:</strong>
            <ul style={{ textAlign: 'left', marginTop: 8 }}>
              <li>OPENWEATHER_API_KEY nicht gesetzt oder ungültig</li>
              <li>API Rate Limit erreicht (60 calls/min im Free Plan)</li>
              <li>Nach Setzen der Variable: Redeploy erforderlich</li>
            </ul>
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
                  <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 0.5 }}>
                    🌅 {formatTime(day.sunrise)} | 🌇 {formatTime(day.sunset)}
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
