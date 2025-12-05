'use client';

/**
 * Climate History Component
 * Displays historical temperature and humidity charts with period selector
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
  minTemp?: number;
  maxTemp?: number;
}

interface ClimateHistoryProps {
  deviceId: string;
  roomName: string;
}

type Period = 'day' | 'week' | 'month' | 'year';

export function ClimateHistory({ deviceId, roomName }: ClimateHistoryProps) {
  const [period, setPeriod] = useState<Period>('day');
  const [data, setData] = useState<HistoryReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shelly/history?deviceId=${deviceId}&period=${period}`);
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Verlaufsdaten');
        }
        const result = await response.json();
        setData(result.readings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [deviceId, period]);

  const handlePeriodChange = (_: React.MouseEvent<HTMLElement>, newPeriod: Period | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  // Format data for charts
  const chartData = data.map((reading) => {
    let label: string;
    if (reading.timestamp) {
      const date = new Date(reading.timestamp);
      if (period === 'day') {
        // Nur Uhrzeit für Tagesansicht
        label = date.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
      } else if (period === 'week') {
        label = date.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      } else {
        label = date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
      }
    } else if (reading.date) {
      // Aggregated data
      if (period === 'year') {
        // Format: "2025-01" -> "Jan 25"
        const [year, month] = reading.date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        label = `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
      } else {
        // Format: "2025-12-05" -> "05.12"
        const [, month, day] = reading.date.split('-');
        label = `${day}.${month}`;
      }
    } else {
      label = '';
    }

    return {
      label,
      temperature: reading.temperature ?? reading.avgTemp ?? 0,
      humidity: reading.humidity ?? reading.avgHumidity ?? 0,
      minTemp: reading.minTemp,
      maxTemp: reading.maxTemp,
    };
  });

  const xLabels = chartData.map((d) => d.label);
  const temperatureData = chartData.map((d) => d.temperature);
  const humidityData = chartData.map((d) => d.humidity);

  const periodLabels: Record<Period, string> = {
    day: 'Letzte 24 Stunden',
    week: 'Letzte 7 Tage',
    month: 'Letzter Monat',
    year: 'Letztes Jahr',
  };

  if (data.length === 0 && !loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Verlauf: {roomName}
        </Typography>
        <Alert severity="info">
          Noch keine historischen Daten vorhanden. Die Daten werden alle 2 Stunden gesammelt.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Verlauf: {roomName}
        </Typography>
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
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Temperatur (°C) - {periodLabels[period]}
            </Typography>
            <LineChart
              height={250}
              series={[
                {
                  data: temperatureData,
                  label: 'Temperatur',
                  color: '#ef5350',
                  showMark: (period === 'day' || period === 'week') && data.length < 50,
                },
              ]}
              xAxis={[
                {
                  data: xLabels,
                  scaleType: 'point',
                  tickLabelStyle: {
                    angle: -45,
                    textAnchor: 'end',
                    fontSize: 10,
                  },
                },
              ]}
              yAxis={[
                {
                  min: Math.min(...temperatureData) - 2,
                  max: Math.max(...temperatureData) + 2,
                },
              ]}
              margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
            />
          </Box>

          {/* Humidity Chart */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Luftfeuchtigkeit (%) - {periodLabels[period]}
            </Typography>
            <LineChart
              height={250}
              series={[
                {
                  data: humidityData,
                  label: 'Luftfeuchtigkeit',
                  color: '#42a5f5',
                  showMark: (period === 'day' || period === 'week') && data.length < 50,
                },
              ]}
              xAxis={[
                {
                  data: xLabels,
                  scaleType: 'point',
                  tickLabelStyle: {
                    angle: -45,
                    textAnchor: 'end',
                    fontSize: 10,
                  },
                },
              ]}
              yAxis={[
                {
                  min: Math.max(0, Math.min(...humidityData) - 5),
                  max: Math.min(100, Math.max(...humidityData) + 5),
                },
              ]}
              margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}
