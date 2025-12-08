/**
 * LiveStats Component
 * Client-side component that polls Victron API for real-time solar data
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert, Paper, Typography } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface SolarData {
  currentPower: number;
  batteryCharge: number;
  batteryPower: number;
  gridPower: number;
  consumption: number;
  todayYield: number;
  todayConsumption: number;
  timestamp: number;
}

interface AutarkieStats {
  total_solar_yield: number;
  total_consumption: number;
  grid_history_from: number;
  autarkie: number;
}

interface LiveStatsProps {
  initialData: SolarData;
  todayPeak: number;
  autarkieStats?: AutarkieStats | null;
}

export function LiveStats({ initialData, todayPeak, autarkieStats }: LiveStatsProps) {
  const [data, setData] = useState<SolarData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Function to fetch latest data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add cache-busting timestamp and disable caching
        const response = await fetch(
          `/api/victron/stats?interval=15mins&t=${Date.now()}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setData(result.processed);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error fetching live data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchData();

    // Poll interval: 60s in development (rate limiting), 15s in production
    const pollInterval = process.env.NODE_ENV === 'development' ? 60000 : 15000;
    const interval = setInterval(fetchData, pollInterval);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Fehler beim Aktualisieren: {error}
        </Alert>
      )}

      {/* Quick Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 3 },
            background:
              'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(66, 165, 245, 0.05) 100%)',
          }}
        >
          <BoltIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'warning.main' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
              {data.currentPower.toFixed(0)}
              <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                W
              </Typography>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Aktuelle Leistung
            </Typography>
          </Box>
        </Paper>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 3 },
            background:
              'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
          }}
        >
          <BatteryChargingFullIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'success.main' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
              {data.batteryCharge.toFixed(1)}
              <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                %
              </Typography>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Batterieladung
            </Typography>
          </Box>
        </Paper>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 3 },
            background:
              'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
          }}
        >
          <WbSunnyIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'warning.main' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
              {data.todayYield.toFixed(2)}
              <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                kWh
              </Typography>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Heutiger Ertrag
            </Typography>
          </Box>
        </Paper>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 3 },
            background:
              'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(66, 165, 245, 0.05) 100%)',
          }}
        >
          <FlashOnIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'info.main' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
              {data.todayConsumption.toFixed(2)}
              <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                kWh
              </Typography>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Verbrauch Heute
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Battery Gauge and Autarkie */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Batterieladung
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              lineHeight: 1,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
              color: data.batteryCharge < 20 ? 'error.main' : data.batteryCharge < 50 ? 'warning.main' : 'success.main',
            }}
          >
            {data.batteryCharge.toFixed(1)}%
          </Typography>
        </Paper>
        {autarkieStats && (
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, sm: 3 },
              background:
                'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'success.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {autarkieStats.autarkie.toFixed(1)}
                <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                  %
                </Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Autarkie
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {autarkieStats.total_solar_yield.toFixed(0)} kWh Solar / {autarkieStats.total_consumption.toFixed(0)} kWh Verbrauch
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </>
  );
}
