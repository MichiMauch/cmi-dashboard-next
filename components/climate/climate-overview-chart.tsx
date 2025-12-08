'use client';

/**
 * Climate Overview Chart Component
 * Displays temperature and humidity charts for all rooms combined
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

interface HistoryReading {
  timestamp?: string;
  date?: string;
  temperature?: number;
  humidity?: number;
  avgTemp?: number;
  avgHumidity?: number;
}

interface RoomData {
  deviceId: string;
  name: string;
  slug: string;
  readings: HistoryReading[];
}

type Period = 'day' | 'week' | 'month' | 'year';

// Distinct colors for each room (same color for temp and humidity per room)
const ROOM_COLORS: Record<string, string> = {
  kueche: '#e91e63',    // Pink
  bad: '#2196f3',       // Blau
  buero: '#4caf50',     // Grün
  schlafen: '#ff9800',  // Orange
  aussen: '#9c27b0',    // Lila
};

export function ClimateOverviewChart() {
  const [period, setPeriod] = useState<Period>('day');
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shelly/history-all?period=${period}`);
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Verlaufsdaten');
        }
        const result = await response.json();
        setRoomsData(result.rooms || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [period]);

  const handlePeriodChange = (_: React.MouseEvent<HTMLElement>, newPeriod: Period | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  // Build unified dataset with all rooms
  const buildChartData = () => {
    // Collect all unique timestamps across all rooms
    const timestampSet = new Set<string>();

    roomsData.forEach((room) => {
      room.readings.forEach((reading) => {
        const key = reading.timestamp || reading.date || '';
        if (key) timestampSet.add(key);
      });
    });

    // Sort timestamps
    const sortedTimestamps = Array.from(timestampSet).sort();

    // Build dataset with all rooms
    return sortedTimestamps.map((ts) => {
      let label: string;
      if (ts.includes('T') || ts.includes(' ')) {
        // It's a timestamp
        const date = new Date(ts);
        if (period === 'day') {
          label = date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
        } else if (period === 'week') {
          const dateStr = date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
          const timeStr = date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
          label = `${dateStr} ${timeStr}`;
        } else {
          label = date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
        }
      } else if (period === 'year') {
        // Format: "2025-01" -> "Jan 25"
        const [year, month] = ts.split('-');
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        label = `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
      } else {
        // Format: "2025-12-05" -> "05.12"
        const parts = ts.split('-');
        label = `${parts[2]}.${parts[1]}`;
      }

      const dataPoint: Record<string, string | number | null> = { label };

      roomsData.forEach((room) => {
        const reading = room.readings.find(
          (r) => (r.timestamp || r.date) === ts
        );
        dataPoint[`temp_${room.slug}`] = reading
          ? (reading.temperature ?? reading.avgTemp ?? null)
          : null;
        dataPoint[`humidity_${room.slug}`] = reading
          ? (reading.humidity ?? reading.avgHumidity ?? null)
          : null;
      });

      return dataPoint;
    });
  };

  const chartData = buildChartData();

  const periodLabels: Record<Period, string> = {
    day: 'Letzte 24 Stunden',
    week: 'Letzte 7 Tage',
    month: 'Letzter Monat',
    year: 'Letztes Jahr',
  };

  // Check if we have any data
  const hasData = roomsData.some((room) => room.readings.length > 0);

  if (!hasData && !loading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Temperatur- und Luftfeuchtigkeitsverlauf
        </Typography>
        <Alert severity="info">
          Noch keine historischen Daten vorhanden. Die Daten werden alle 2 Stunden gesammelt.
        </Alert>
      </Paper>
    );
  }

  // Build series for temperature chart
  const tempSeries = roomsData.map((room) => ({
    dataKey: `temp_${room.slug}`,
    label: room.name,
    color: ROOM_COLORS[room.slug] || '#999999',
    showMark: chartData.length < 30,
    connectNulls: true,
  }));

  // Build series for humidity chart
  const humiditySeries = roomsData.map((room) => ({
    dataKey: `humidity_${room.slug}`,
    label: room.name,
    color: ROOM_COLORS[room.slug] || '#999999',
    showMark: chartData.length < 30,
    connectNulls: true,
  }));

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Temperatur- und Luftfeuchtigkeitsverlauf</Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="day">Tag</ToggleButton>
          <ToggleButton value="week">Woche</ToggleButton>
          <ToggleButton value="month">Monat</ToggleButton>
          <ToggleButton value="year">Jahr</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Temperature Chart */}
          <Box sx={{ width: '100%', height: 350 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Temperatur (°C) - {periodLabels[period]}
            </Typography>
            <LineChart
              dataset={chartData}
              xAxis={[
                {
                  scaleType: 'band',
                  dataKey: 'label',
                },
              ]}
              series={tempSeries}
              height={300}
              margin={{ bottom: 70 }}
            />
          </Box>

          {/* Humidity Chart */}
          <Box sx={{ width: '100%', height: 350 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Luftfeuchtigkeit (%) - {periodLabels[period]}
            </Typography>
            <LineChart
              dataset={chartData}
              xAxis={[
                {
                  scaleType: 'band',
                  dataKey: 'label',
                },
              ]}
              series={humiditySeries}
              height={300}
              margin={{ bottom: 70 }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}
