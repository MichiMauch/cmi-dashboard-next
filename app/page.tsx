/**
 * Dashboard Home Page
 * Main dashboard overview with laundry forecast
 */

'use client';

import { Typography, Box, Card, CardContent, CircularProgress, Alert, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShowChartIcon from '@mui/icons-material/ShowChart';
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

interface IndoorSensor {
  name: string;
  temperature: number;
}

interface DashboardOverview {
  fireEvents: {
    total: number;
    thisMonth: number;
    avgPerMonth: number;
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
  climate: {
    rooms: IndoorSensor[];
    outdoor: {
      temperature: number;
      humidity: number;
    } | null;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;
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
      const [heatingRes, solarRes, weatherRes, shellyRes] = await Promise.all([
        fetch('/api/data', { cache: 'no-store' }),
        fetch('/api/victron/stats?interval=15mins', { cache: 'no-store' }),
        fetch('/api/weather', { cache: 'no-store' }),
        fetch('/api/shelly', { cache: 'no-store' }),
      ]);

      if (!heatingRes.ok || !solarRes.ok || !weatherRes.ok) {
        throw new Error('Failed to fetch overview data');
      }

      const heatingData = await heatingRes.json();
      const solarData = await solarRes.json();
      const weatherData = await weatherRes.json();
      const shellyData = shellyRes.ok ? await shellyRes.json() : { sensors: [] };

      // Extract fire event data
      const fireEvents = heatingData.fire_events || [];
      const monthlyStats = heatingData.monthly_stats || [];
      const totalEvents = fireEvents.length;
      const thisMonth = monthlyStats[0]?.count ?? 0;
      const avgPerMonth = monthlyStats.length > 0
        ? monthlyStats.reduce((sum: number, stat: any) => sum + stat.count, 0) / monthlyStats.length
        : 0;

      // Extract solar data
      const solar = solarData.processed || {};

      // Extract weather data
      const weather = weatherData.current || {};

      // Extract indoor climate data (exclude "Aussen" sensor)
      const OUTDOOR_DEVICE_ID = 'XB137192906310216';
      const roomNames: Record<string, string> = {
        'e4b3232f84a8': 'Küche',
        'e4b32332e2c8': 'Bad',
        'e4b323304058': 'Büro',
        'e4b3233182e8': 'Schlafzimmer',
      };
      const indoorRooms = (shellyData.sensors || [])
        .filter((s: any) => s.id !== OUTDOOR_DEVICE_ID)
        .map((s: any) => ({
          name: roomNames[s.id] || s.name || 'Unbekannt',
          temperature: s.temperature ?? 0,
        }));

      // Extract outdoor sensor data
      const outdoorSensor = (shellyData.sensors || [])
        .find((s: any) => s.id === OUTDOOR_DEVICE_ID);
      const outdoor = outdoorSensor
        ? { temperature: outdoorSensor.temperature ?? 0, humidity: outdoorSensor.humidity ?? 0 }
        : null;

      setOverview({
        fireEvents: {
          total: totalEvents,
          thisMonth,
          avgPerMonth,
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
        climate: {
          rooms: indoorRooms,
          outdoor,
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
    <Box>
        {/* Dashboard Overview Cards */}
        {overviewLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, mb: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 1. Climate Cards - Indoor (2/3) + Outdoor (1/3) */}
        {overview && !overviewLoading && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Indoor Climate Card - 2/3 */}
            {overview.climate.rooms.length > 0 && (
              <Card
                elevation={3}
                sx={{
                  background: 'linear-gradient(135deg, rgba(239, 83, 80, 0.1) 0%, rgba(239, 83, 80, 0.05) 100%)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <ThermostatIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'error.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Raumtemperaturen
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 3,
                    }}
                  >
                    {overview.climate.rooms.map((room) => (
                      <Box key={room.name} sx={{ textAlign: 'center' }}>
                        <Typography
                          sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
                        >
                          {room.temperature.toFixed(1)}°C
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {room.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Outdoor Climate Card - 1/3 */}
            {overview.climate.outdoor && (
              <Card
                elevation={3}
                sx={{
                  background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(66, 165, 245, 0.05) 100%)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <WbSunnyIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'info.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Aussen
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
                      >
                        {overview.climate.outdoor.temperature.toFixed(1)}°C
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Temperatur
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
                      >
                        {overview.climate.outdoor.humidity.toFixed(0)}%
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Luftfeuchtigkeit
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* 2. Solar Section */}
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
          </Box>
        )}

        {/* 3. Fire Events Section */}
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
            <StatCard
              title="Gesamt Feuer-Events"
              value={overview.fireEvents.total}
              icon={<LocalFireDepartmentIcon />}
              color="error"
            />
            <StatCard
              title="Dieser Monat"
              value={overview.fireEvents.thisMonth}
              icon={<CalendarMonthIcon />}
              color="warning"
            />
            <StatCard
              title="Ø pro Monat"
              value={overview.fireEvents.avgPerMonth.toFixed(1)}
              icon={<ShowChartIcon />}
              color="info"
            />
          </Box>
        )}

        {/* 4. Laundry Forecast Card */}
        <Card
          elevation={3}
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
              {isAuthenticated && (
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  sx={{ ml: 2 }}
                >
                  {refreshing ? 'Aktualisiere...' : 'Neu berechnen'}
                </Button>
              )}
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
  );
}
