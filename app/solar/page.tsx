/**
 * Solar Dashboard Page
 * Displays solar panel, battery, and consumption data from Victron Energy
 */

import { fetchVictronStats, processSolarData } from '@/lib/victron';
import { fetchWithTokenRefresh } from '@/lib/victron-token';
import {
  fetchLast7Days,
  fetchLast24Months,
  fetchAutarkieStats,
  fetchLast30DaysPeakPower,
} from '@/lib/victron-history';
import { LiveStats } from '@/components/solar/live-stats';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, DataTableColumn } from '@/components/shared/data-table';
import { ChartCard } from '@/components/shared/chart-card';
import { Container, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PowerIcon from '@mui/icons-material/Power';

export const revalidate = 15; // Revalidate every 15 seconds

async function getSolarData() {
  try {
    const installationId = process.env.VICTRON_INSTALLATION_ID;

    if (!installationId) {
      throw new Error('VICTRON_INSTALLATION_ID not configured');
    }

    console.log('[SolarPage] Fetching Victron data...');

    const stats = await fetchWithTokenRefresh((token) =>
      fetchVictronStats(installationId, token, '15mins', 'live_feed')
    );

    const processedData = processSolarData(stats);

    console.log('[SolarPage] Data fetched successfully');

    return {
      raw: stats,
      processed: processedData,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[SolarPage] Error fetching solar data:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default async function SolarPage() {
  const [solarData, last7Days, last24Months, autarkieStats, peakPowerHistory] = await Promise.all([
    getSolarData(),
    fetchLast7Days().catch(() => []),
    fetchLast24Months().catch(() => []),
    fetchAutarkieStats().catch(() => null),
    fetchLast30DaysPeakPower().catch(() => []),
  ]);

  if (!solarData || 'error' in solarData) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            ⚠️ Solar-Daten nicht verfügbar
          </Typography>
          <Typography color="text.secondary" paragraph>
            Die Victron API kann derzeit nicht erreicht werden.
          </Typography>
          {'error' in solarData && (
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
              {solarData.error}
            </Box>
          )}
        </Box>
      </Container>
    );
  }

  const { processed } = solarData;

  // Prepare chart data
  const monthlyChartData = last24Months.map((item) => ({
    month: new Date(item.timestamp).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
    yield: item.total_solar_yield,
    consumption: item.total_consumption,
    gridImport: item.grid_history_from,
  }));

  const peakPowerChartData = peakPowerHistory.map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    peak: item.peak_power / 1000, // Convert to kW
  }));

  // Prepare table data (format on server)
  const last7DaysRows = last7Days.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleDateString('de-DE'),
    total_solar_yield: `${item.total_solar_yield.toFixed(2)} kWh`,
    total_consumption: `${item.total_consumption.toFixed(2)} kWh`,
  }));

  const last7DaysColumns: DataTableColumn[] = [
    { id: 'timestamp', label: 'Datum' },
    { id: 'total_solar_yield', label: 'Ertrag', align: 'right' },
    { id: 'total_consumption', label: 'Verbrauch', align: 'right' },
  ];

  const monthlyDataRows = last24Months.slice(0, 12).map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
    total_solar_yield: `${item.total_solar_yield.toFixed(2)} kWh`,
    total_consumption: `${item.total_consumption.toFixed(2)} kWh`,
    grid_history_from: `${item.grid_history_from.toFixed(2)} kWh`,
  }));

  const monthlyDataColumns: DataTableColumn[] = [
    { id: 'timestamp', label: 'Monat' },
    { id: 'total_solar_yield', label: 'Solar Ertrag', align: 'right' },
    { id: 'total_consumption', label: 'Verbrauch', align: 'right' },
    { id: 'grid_history_from', label: 'Netz Bezug', align: 'right' },
  ];

  // Calculate peak power for today
  const todayPeak = peakPowerHistory[0]?.peak_power || 0;

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
              background: 'linear-gradient(to right, #eab308, #ea580c)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
          >
            ☀️ Solar Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Live-Daten von Victron Energy VRM
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Letztes Update: {new Date(solarData.timestamp).toLocaleString('de-DE')}
          </Typography>
        </Box>

        {/* Live Stats with auto-refresh */}
        <LiveStats
          initialData={processed}
          todayPeak={todayPeak}
          autarkieStats={autarkieStats}
        />

        {/* Year Statistics */}
        {autarkieStats && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            <StatCard
              title="Solar Ertrag (Jahr)"
              value={`${autarkieStats.total_solar_yield.toFixed(0)} kWh`}
              icon={<WbSunnyIcon />}
              color="warning"
            />
            <StatCard
              title="Verbrauch (Jahr)"
              value={`${autarkieStats.total_consumption.toFixed(0)} kWh`}
              icon={<ElectricBoltIcon />}
              color="info"
            />
            <StatCard
              title="Netzbezug (Jahr)"
              value={`${autarkieStats.grid_history_from.toFixed(0)} kWh`}
              icon={<PowerIcon />}
              color="error"
            />
          </Box>
        )}

        {/* Data Tables */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {last7Days.length > 0 && (
            <DataTable title="Letzte 7 Tage" columns={last7DaysColumns} rows={last7DaysRows} maxHeight={400} />
          )}
          {last24Months.length > 0 && (
            <DataTable
              title="Monatliche Daten"
              columns={monthlyDataColumns}
              rows={monthlyDataRows}
              maxHeight={400}
            />
          )}
        </Box>

        {/* Charts */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {monthlyChartData.length > 0 && (
            <ChartCard title="Monatlicher Ertrag" height={300}>
              <BarChart
                dataset={monthlyChartData}
                xAxis={[
                  {
                    scaleType: 'band',
                    dataKey: 'month',
                    tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 10 },
                  },
                ]}
                series={[
                  {
                    dataKey: 'yield',
                    label: 'Solar Ertrag (kWh)',
                    color: '#eab308',
                  },
                  {
                    dataKey: 'consumption',
                    label: 'Verbrauch (kWh)',
                    color: '#3b82f6',
                  },
                ]}
                height={300}
              />
            </ChartCard>
          )}

          {peakPowerChartData.length > 0 && (
            <ChartCard title="Spitzenleistung (30 Tage)" height={300}>
              <LineChart
                dataset={peakPowerChartData}
                xAxis={[
                  {
                    scaleType: 'band',
                    dataKey: 'date',
                    tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 10 },
                  },
                ]}
                series={[
                  {
                    dataKey: 'peak',
                    label: 'Peak (kW)',
                    color: '#dc2626',
                    showMark: false,
                  },
                ]}
                height={300}
              />
            </ChartCard>
          )}
        </Box>

        {/* Grid Import Chart */}
        {monthlyChartData.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <ChartCard title="Netzbezug Verlauf" height={300}>
              <BarChart
                dataset={monthlyChartData}
                xAxis={[
                  {
                    scaleType: 'band',
                    dataKey: 'month',
                    tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 10 },
                  },
                ]}
                series={[
                  {
                    dataKey: 'gridImport',
                    label: 'Netzbezug (kWh)',
                    color: '#ef4444',
                  },
                ]}
                height={300}
              />
            </ChartCard>
          </Box>
        )}
      </Box>
    </Container>
  );
}
