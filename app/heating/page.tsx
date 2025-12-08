/**
 * KOKOMO Heating Dashboard - Main Page
 * Displays real-time heating system data from CMI via Raspberry Pi
 */

import { getDashboardData } from '@/lib/data';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

  return (
    <Box>

        {/* Key Metrics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
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
            <LocalFireDepartmentIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'error.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {totalEvents}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gesamt Feuer-Events
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
            <CalendarMonthIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'warning.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {currentMonthStats?.count ?? 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Dieser Monat
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
            <ShowChartIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'info.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {data.monthly_stats.length > 0
                  ? (
                      data.monthly_stats.reduce((sum, stat) => sum + stat.count, 0) /
                      data.monthly_stats.length
                    ).toFixed(1)
                  : '0'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ø pro Monat
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Temperature Cards */}
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
              .map((temp) => (
                <Paper
                  key={temp.nummer}
                  elevation={3}
                  sx={{
                    p: { xs: 2, sm: 3, md: 4 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 2, sm: 3 },
                    background:
                      'linear-gradient(135deg, rgba(239, 83, 80, 0.1) 0%, rgba(239, 83, 80, 0.05) 100%)',
                  }}
                >
                  <ThermostatIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'error.main' }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                      {temp.wert.toFixed(1)}
                      <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                        °C
                      </Typography>
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {temp.ort || `Sensor ${temp.nummer}`}
                    </Typography>
                  </Box>
                </Paper>
              ))}
          </Box>
        </Box>

        {/* Fire Statistics */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            🔥 Feuer-Statistik
          </Typography>

          {/* Recent Fire Events Table */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 3,
              background:
                'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              🕒 Letzte Feuer-Events
            </Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Zeitpunkt</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Temperatur</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Typ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fireEventsRows.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{row.timestamp}</TableCell>
                      <TableCell>{row.temperature}</TableCell>
                      <TableCell>{row.event_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Monthly Bar Chart */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 3,
              background:
                'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📊 Feuer-Events pro Monat
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
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
            </Box>
          </Paper>

          {/* Monthly Stats Table */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              background:
                'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📅 Monatliche Übersicht
            </Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Monat</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Anzahl</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ø Temp</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Max Temp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyStatsRows.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{row.month}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>{row.avg_temp}</TableCell>
                      <TableCell>{row.max_temp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Daten werden stündlich vom Raspberry Pi aktualisiert
          </Typography>
        </Box>
    </Box>
  );
}
