/**
 * LiveStats Component
 * Client-side component that polls Victron API for real-time solar data
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { StatCard } from '@/components/shared/stat-card';
import { MetricCard } from '@/components/shared/metric-card';
import { GaugeCard } from '@/components/shared/gauge-card';
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
        <StatCard
          title="Aktuelle Leistung"
          value={`${data.currentPower.toFixed(0)} W`}
          icon={<BoltIcon />}
          color="warning"
        />
        <StatCard
          title="Batterieladung"
          value={`${data.batteryCharge.toFixed(1)} %`}
          icon={<BatteryChargingFullIcon />}
          color="success"
        />
        <StatCard
          title="Heutiger Ertrag"
          value={`${data.todayYield.toFixed(2)} kWh`}
          icon={<WbSunnyIcon />}
          color="warning"
        />
        <StatCard
          title="Verbrauch Heute"
          value={`${data.todayConsumption.toFixed(2)} kWh`}
          icon={<FlashOnIcon />}
          color="info"
        />
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
        <GaugeCard
          title="Batterieladung"
          value={data.batteryCharge}
          maxValue={100}
          unit="%"
          thresholds={{ low: 20, medium: 50, high: 100 }}
        />
        {autarkieStats && (
          <MetricCard
            title="Autarkie"
            value={autarkieStats.autarkie.toFixed(1)}
            unit="%"
            icon={<CheckCircleIcon />}
            color="success"
            subtitle={`${autarkieStats.total_solar_yield.toFixed(0)} kWh Solar / ${autarkieStats.total_consumption.toFixed(0)} kWh Verbrauch`}
          />
        )}
      </Box>
    </>
  );
}
