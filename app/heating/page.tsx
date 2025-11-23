/**
 * KOKOMO Heating Dashboard - Main Page
 * Displays real-time heating system data from CMI via Raspberry Pi
 */

import { getDashboardData } from '@/lib/data';
import { StatCard } from '@/components/shared/stat-card';
import { GaugeCard } from '@/components/shared/gauge-card';
import { DataTable, DataTableColumn } from '@/components/shared/data-table';
import { ChartCard } from '@/components/shared/chart-card';
import { Container, Typography, Box, Chip, Stack } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShowChartIcon from '@mui/icons-material/ShowChart';

export const revalidate = 300; // Revalidate every 5 minutes

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januar',
  '02': 'Februar',
  '03': 'März',
  '04': 'April',
  '05': 'Mai',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'August',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Dezember',
};

const STATE_CONFIG = {
  cold: { label: '❄️ KALT', color: 'info' as const },
  warming: { label: '📈 AUFWÄRMEN', color: 'warning' as const },
  hot: { label: '🔥 HEISS', color: 'error' as const },
  cooling: { label: '📉 ABKÜHLEN', color: 'success' as const },
};

export default async function HeatingPage() {
  const data = await getDashboardData();

  // Calculate total events
  const totalEvents = data.fire_events.length;

  // Get current month stats
  const currentMonthStats = data.monthly_stats[0];

  // Prepare chart data
  const chartData = data.monthly_stats
    .map((stat) => {
      const [year, month] = stat.month.split('-');
      return {
        month: `${MONTH_NAMES[month]} ${year}`,
        count: stat.count,
      };
    })
    .reverse();

  // Prepare fire events table data (format on server)
  const fireEventsRows = data.fire_events.slice(0, 10).map((event) => ({
    timestamp: format(new Date(event.timestamp), 'dd.MM.yyyy - HH:mm', { locale: de }),
    temperature: `${event.temperature.toFixed(1)} °C`,
    event_type: event.event_type === 'fire_started' ? 'Gestartet' : event.event_type,
  }));

  const fireEventsColumns: DataTableColumn[] = [
    { id: 'timestamp', label: 'Zeitpunkt' },
    { id: 'temperature', label: 'Temperatur' },
    { id: 'event_type', label: 'Typ' },
  ];

  // Prepare monthly stats table data (format on server)
  const monthlyStatsRows = data.monthly_stats.map((stat) => {
    const [year, month] = stat.month.split('-');
    return {
      month: `${MONTH_NAMES[month]} ${year}`,
      count: stat.count,
      avg_temp: `${stat.avg_temp.toFixed(1)} °C`,
      max_temp: `${stat.max_temp.toFixed(1)} °C`,
    };
  });

  const monthlyStatsColumns: DataTableColumn[] = [
    { id: 'month', label: 'Monat' },
    { id: 'count', label: 'Anzahl' },
    { id: 'avg_temp', label: 'Ø Temp' },
    { id: 'max_temp', label: 'Max Temp' },
  ];

  const stateConfig = STATE_CONFIG[data.oven_state.state];

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
              background: 'linear-gradient(to right, #f97316, #dc2626)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
          >
            🔥 KOKOMO Heating Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Live-Daten aus der CMI JSON API
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Letztes Update: {format(new Date(data.last_updated), 'dd.MM.yyyy - HH:mm', { locale: de })}
          </Typography>
        </Box>

        {/* Oven Status */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Ofen Status:
            </Typography>
            <Chip label={stateConfig.label} color={stateConfig.color} />
          </Box>
        </Box>

        {/* Key Metrics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <StatCard
            title="Gesamt Feuer-Events"
            value={totalEvents}
            icon={<LocalFireDepartmentIcon />}
            color="error"
          />
          <StatCard
            title="Dieser Monat"
            value={currentMonthStats?.count ?? 0}
            icon={<CalendarMonthIcon />}
            color="warning"
          />
          <StatCard
            title="Ø pro Monat"
            value={
              data.monthly_stats.length > 0
                ? (
                    data.monthly_stats.reduce((sum, stat) => sum + stat.count, 0) /
                    data.monthly_stats.length
                  ).toFixed(1)
                : '0'
            }
            icon={<ShowChartIcon />}
            color="info"
          />
        </Box>

        {/* Temperature Gauges */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            🌡️ Temperaturen
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {data.current_temps
              .filter((temp) => temp.nummer >= 1 && temp.nummer <= 6)
              .sort((a, b) => a.nummer - b.nummer)
              .map((temp) => {
                const isOven = temp.nummer === 4;
                const maxTemp = isOven ? 200 : 100;
                return (
                  <GaugeCard
                    key={temp.nummer}
                    title={temp.ort || `Sensor ${temp.nummer}`}
                    value={parseFloat(temp.wert.toFixed(1))}
                    maxValue={maxTemp}
                    unit="°C"
                    thresholds={
                      isOven
                        ? { low: 40, medium: 60, high: 100 }
                        : { low: 20, medium: 40, high: 60 }
                    }
                  />
                );
              })}
          </Box>
        </Box>

        {/* Fire Statistics */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            🔥 Feuer-Statistik
          </Typography>

          {/* Recent Fire Events Table */}
          <Box sx={{ mb: 3 }}>
            <DataTable
              title="🕒 Letzte Feuer-Events"
              columns={fireEventsColumns}
              rows={fireEventsRows}
              maxHeight={400}
            />
          </Box>

          {/* Monthly Bar Chart */}
          <Box sx={{ mb: 3 }}>
            <ChartCard title="📊 Feuer-Events pro Monat" height={300}>
              {chartData.length > 0 ? (
                <BarChart
                  dataset={chartData}
                  xAxis={[
                    {
                      scaleType: 'band',
                      dataKey: 'month',
                      tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 10 },
                    },
                  ]}
                  series={[
                    {
                      dataKey: 'count',
                      label: 'Feuer Events',
                      color: '#f97316',
                    },
                  ]}
                  height={300}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">Noch keine Statistiken verfügbar</Typography>
                </Box>
              )}
            </ChartCard>
          </Box>

          {/* Monthly Stats Table */}
          <DataTable
            title="📅 Monatliche Übersicht"
            columns={monthlyStatsColumns}
            rows={monthlyStatsRows}
            maxHeight={400}
          />
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Daten werden stündlich vom Raspberry Pi aktualisiert
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
