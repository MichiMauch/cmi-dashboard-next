/**
 * Weather Page
 * Displays current weather and forecast for Muhen
 */

import { Typography, Box, Card, CardContent } from '@mui/material';
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
 * Fetch weather data directly (no HTTP call needed in Server Component)
 */
async function getWeatherData(): Promise<ProcessedWeatherData | { error: string } | null> {
  try {
    console.log('[WeatherPage] Fetching weather data...');

    // Import weather fetching function
    const { fetchWeatherData } = await import('@/lib/weather');

    // Call directly - no HTTP request needed
    const data = await fetchWeatherData();

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
      <Box sx={{ textAlign: 'center', py: 8 }}>
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
    );
  }

  const { current, hourly, daily, location } = weatherData;

  // Prepare hourly chart data
  const hourlyChartData = hourly.map((h) => ({
    time: h.time,
    temp: h.temp,
  }));

  return (
    <Box>
        {/* Current Weather Hero Card */}
        <Card
          elevation={3}
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(66, 165, 245, 0.05) 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
                  <Typography
                    component="div"
                    sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
                  >
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
              <Card
                key={index}
                elevation={3}
                sx={{
                  background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
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
  );
}
