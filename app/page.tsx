/**
 * Dashboard Home Page
 * Main dashboard overview with laundry forecast
 */

'use client';

import { Container, Typography, Box, Card, CardContent, CircularProgress, Alert, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BoltIcon from '@mui/icons-material/Bolt';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { StatCard } from '@/components/shared/stat-card';

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

interface DashboardOverview {
  heating: {
    ofen: number;
    speicherOben: number;
    speicherUnten: number;
  };
  solar: {
    currentPower: number;
    battery: number;
    todayYield: number;
  };
  weather: {
    temperature: number;
    humidity: number;
    visibility: number;
  };
}

export default function DashboardPage() {
  const [forecast, setForecast] = useState<LaundryForecast | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/laundry-forecast', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch forecast');
      }
      const data = await response.json();
      setForecast(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);

      // Fetch all data in parallel
      const [heatingRes, solarRes, weatherRes] = await Promise.all([
        fetch('/api/data', { cache: 'no-store' }),
        fetch('/api/victron/stats?interval=15mins', { cache: 'no-store' }),
        fetch('/api/weather', { cache: 'no-store' }),
      ]);

      if (!heatingRes.ok || !solarRes.ok || !weatherRes.ok) {
        throw new Error('Failed to fetch overview data');
      }

      const heatingData = await heatingRes.json();
      const solarData = await solarRes.json();
      const weatherData = await weatherRes.json();

      // Extract heating temps (current_temps array)
      const temps = heatingData.current_temps || [];
      const ofen = temps.find((t: any) => t.ort === 'Ofen')?.wert || 0;
      const speicherOben = temps.find((t: any) => t.ort === 'Speicher Oben')?.wert || 0;
      const speicherUnten = temps.find((t: any) => t.ort === 'Speicher Unten')?.wert || 0;

      // Extract solar data
      const solar = solarData.processed || {};

      // Extract weather data
      const weather = weatherData.current || {};

      setOverview({
        heating: {
          ofen,
          speicherOben,
          speicherUnten,
        },
        solar: {
          currentPower: solar.currentPower || 0,
          battery: solar.batteryCharge || 0,
          todayYield: solar.todayYield || 0,
        },
        weather: {
          temperature: weather.temp || 0,
          humidity: weather.humidity || 0,
          visibility: weather.visibility ? weather.visibility / 1000 : 0, // Convert m to km
        },
      });
    } catch (err) {
      console.error('Error fetching overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Trigger forecast generation
      const generateResponse = await fetch('/api/laundry-forecast/generate', {
        cache: 'no-store',
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate new forecast');
      }

      // Wait a moment for the blob to be written
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the updated forecast
      await fetchForecast();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForecast();
    fetchOverview();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
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
            mb: 4,
          }}
        >
          Dashboard
        </Typography>

        {/* Dashboard Overview Cards */}
        {overviewLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, mb: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {overview && !overviewLoading && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Heating Section */}
            <StatCard
              title="Ofen"
              value={`${overview.heating.ofen.toFixed(1)}°C`}
              icon={<LocalFireDepartmentIcon />}
              color="error"
            />
            <StatCard
              title="Speicher Oben"
              value={`${overview.heating.speicherOben.toFixed(1)}°C`}
              icon={<ThermostatIcon />}
              color="warning"
            />
            <StatCard
              title="Speicher Unten"
              value={`${overview.heating.speicherUnten.toFixed(1)}°C`}
              icon={<ThermostatIcon />}
              color="info"
            />

            {/* Solar Section */}
            <StatCard
              title="Aktuelle Leistung"
              value={`${overview.solar.currentPower.toFixed(0)} W`}
              icon={<BoltIcon />}
              color="success"
            />
            <StatCard
              title="Batterie"
              value={`${overview.solar.battery.toFixed(0)}%`}
              icon={<BatteryChargingFullIcon />}
              color="primary"
            />
            <StatCard
              title="Heutiger Ertrag"
              value={`${overview.solar.todayYield.toFixed(1)} kWh`}
              icon={<WbSunnyIcon />}
              color="warning"
            />

            {/* Weather Section */}
            <StatCard
              title="Temperatur"
              value={`${overview.weather.temperature.toFixed(1)}°C`}
              icon={<ThermostatIcon />}
              color="info"
            />
            <StatCard
              title="Luftfeuchtigkeit"
              value={`${overview.weather.humidity.toFixed(0)}%`}
              icon={<OpacityIcon />}
              color="primary"
            />
            <StatCard
              title="Sichtweite"
              value={`${overview.weather.visibility.toFixed(1)} km`}
              icon={<VisibilityIcon />}
              color="success"
            />
          </Box>
        )}

        {/* Laundry Forecast Card */}
        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    backgroundColor: 'primary.main',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <Typography variant="h4">👕</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Wäsche aufhängen - Beste Gelegenheit
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing || loading}
                sx={{ ml: 2 }}
              >
                {refreshing ? 'Aktualisiere...' : 'Neu berechnen'}
              </Button>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Fehler beim Laden der Vorhersage: {error}
              </Alert>
            )}

            {forecast && !loading && !error && (
              <Box>
                {/* Best Day Highlight */}
                <Box
                  sx={{
                    backgroundColor: 'success.main',
                    color: 'success.contrastText',
                    borderRadius: 2,
                    p: 3,
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {forecast.bestDay.dayName}
                      </Typography>
                      <Typography variant="h6">{forecast.bestDay.date}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 1 }}>
                    <strong>Empfohlenes Zeitfenster:</strong> {forecast.bestDay.timeWindow}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {forecast.reasoning}
                  </Typography>
                </Box>

                {/* Weather Summary */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ThermostatIcon sx={{ fontSize: 32, mr: 1.5, color: 'error.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Temperatur
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {forecast.weatherSummary.temperature}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <OpacityIcon sx={{ fontSize: 32, mr: 1.5, color: 'info.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Luftfeuchtigkeit
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {forecast.weatherSummary.humidity}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <WbSunnyIcon sx={{ fontSize: 32, mr: 1.5, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Regenwahrscheinlichkeit
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {forecast.weatherSummary.rain}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 5-Day Overview */}
                {forecast.allDays && forecast.allDays.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                      Alle 5 Tage im Überblick
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' },
                        gap: 2,
                      }}
                    >
                      {forecast.allDays.map((day, index) => {
                        // Determine badge color and icon based on rating
                        let badgeColor: 'success' | 'info' | 'warning' | 'error' = 'info';
                        let ratingText = '';
                        let icon = '👕';

                        switch (day.rating) {
                          case 'excellent':
                            badgeColor = 'success';
                            ratingText = 'Ausgezeichnet';
                            icon = '✅';
                            break;
                          case 'good':
                            badgeColor = 'info';
                            ratingText = 'Gut';
                            icon = '⭐';
                            break;
                          case 'fair':
                            badgeColor = 'warning';
                            ratingText = 'Okay';
                            icon = '🌤️';
                            break;
                          case 'poor':
                            badgeColor = 'error';
                            ratingText = 'Nicht empfohlen';
                            icon = '⛈️';
                            break;
                        }

                        return (
                          <Card
                            key={index}
                            elevation={2}
                            sx={{
                              border: day.dayName === forecast.bestDay.dayName ? '2px solid' : 'none',
                              borderColor: 'success.main',
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {day.dayName}
                                </Typography>
                                <Typography variant="h4">{icon}</Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                {day.date}
                              </Typography>

                              <Box
                                sx={{
                                  backgroundColor: `${badgeColor}.main`,
                                  color: `${badgeColor}.contrastText`,
                                  borderRadius: 1,
                                  px: 1,
                                  py: 0.5,
                                  mb: 1.5,
                                  textAlign: 'center',
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {ratingText}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2">
                                  🌡️ {day.temperature}
                                </Typography>
                                <Typography variant="body2">
                                  💧 {day.rainProbability}% Regen
                                </Typography>
                                <Typography variant="body2">
                                  💨 {day.humidity}% Luftf.
                                </Typography>
                              </Box>

                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {day.reason}
                              </Typography>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
