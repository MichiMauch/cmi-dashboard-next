/**
 * Dashboard Home Page
 * Main dashboard overview
 */

'use client';

import { Typography, Box, Card, CardContent, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BoltIcon from '@mui/icons-material/Bolt';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { StatCard } from '@/components/shared/stat-card';

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
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

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

  useEffect(() => {
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
    </Box>
  );
}
