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
  fetchLast5YearsGridImport,
} from '@/lib/victron-history';
import { getCachedOrFetch } from '@/lib/dev-cache';
import { LiveStats } from '@/components/solar/live-stats';
import { MonthlyChart } from '@/components/solar/monthly-chart';
import { YearlyGridChart } from '@/components/solar/yearly-grid-chart';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, DataTableColumn } from '@/components/shared/data-table';
import { ChartCard } from '@/components/shared/chart-card';
import { Container, Typography, Box, Chip } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PowerIcon from '@mui/icons-material/Power';
import PlugIcon from '@mui/icons-material/Power';
import BoltIcon from '@mui/icons-material/Bolt';

// Revalidate every 60 seconds (increased from 15 to reduce API calls)
export const revalidate = 60;

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mrz',
  '04': 'Apr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Dez',
};

async function getSolarData() {
  try {
    const installationId = process.env.VICTRON_INSTALLATION_ID;

    if (!installationId) {
      throw new Error('VICTRON_INSTALLATION_ID not configured');
    }

    console.log('[SolarPage] Fetching Victron data...');

    const stats = await fetchWithTokenRefresh((token) =>
      fetchVictronStats(installationId, token, '15mins')
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
  const [solarData, last7Days, last24Months, autarkieStats, peakPowerHistory, yearlyGridImport] = await Promise.all([
    getCachedOrFetch('solar-data', () => getSolarData()),
    getCachedOrFetch('last-7-days', () => fetchLast7Days().catch(() => [])),
    getCachedOrFetch('last-24-months', () => fetchLast24Months().catch(() => [])),
    getCachedOrFetch('autarkie-stats', () => fetchAutarkieStats().catch(() => null)),
    getCachedOrFetch('peak-power-30d', () => fetchLast30DaysPeakPower().catch(() => [])),
    getCachedOrFetch('yearly-grid-import', () => fetchLast5YearsGridImport().catch(() => [])),
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

  // Prepare chart data (take newest 12 months, then reverse for chronological order: old left, new right)
  const monthlyChartData = [...last24Months].slice(0, 12).reverse().map((item) => {
    const date = new Date(item.timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return {
      month: `${MONTH_NAMES[month]} ${year}`,
      yield: item.total_solar_yield,
      consumption: item.total_consumption,
      gridImport: item.grid_history_from,
    };
  });

  // Prepare peak power chart data (already in chronological order: old left, new right)
  const peakPowerChartData = peakPowerHistory.map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    peak: item.peak_power, // Keep in Watts
  }));

  // Prepare table data (format on server, reverse copy for newest first)
  const last7DaysRows = [...last7Days].reverse().map((item) => ({
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography
              variant="h3"
              component="h1"
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
            <Chip
              icon={processed.gridPower > 0 ? <PlugIcon /> : <BoltIcon />}
              label={processed.gridPower > 0 ? 'Netzstrom' : 'Autark'}
              color={processed.gridPower > 0 ? 'warning' : 'success'}
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
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
            <DataTable title="Letzte 11 Tage" columns={last7DaysColumns} rows={last7DaysRows} maxHeight={400} />
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

        {/* Monthly Yield Chart */}
        {monthlyChartData.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <ChartCard title="Monatlicher Ertrag" height={350}>
              <MonthlyChart data={monthlyChartData} />
            </ChartCard>
          </Box>
        )}

        {/* Peak Power and Grid Import Charts */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {peakPowerChartData.length > 0 && (
            <ChartCard title="Spitzenleistungen der letzten 30 Tage" height={300}>
              <LineChart
                dataset={peakPowerChartData}
                xAxis={[
                  {
                    scaleType: 'band',
                    dataKey: 'date',
                    tickLabelStyle: { angle: -45, textAnchor: 'end', fontSize: 10 },
                  },
                ]}
                yAxis={[
                  {
                    label: 'Spitzenleistung (W)',
                  },
                ]}
                series={[
                  {
                    dataKey: 'peak',
                    label: 'Peak Power (W)',
                    color: '#06b6d4',
                    showMark: true,
                  },
                ]}
                height={300}
              />
            </ChartCard>
          )}

          {yearlyGridImport.length > 0 && (
            <ChartCard title="Strombezug von extern der letzten 5 Jahre" height={300}>
              <YearlyGridChart data={yearlyGridImport} />
            </ChartCard>
          )}
        </Box>
      </Box>
    </Container>
  );
}
