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
import {
  calculateYearlyCosts,
  calculateDailyCosts,
  formatCurrency,
  ELECTRICITY_PRICE_RAPPEN,
  ELECTRICITY_PRICE_SOURCE,
} from '@/lib/electricity-costs';
import { getGridPeriods, calculateDays, isActivePeriod } from '@/lib/grid-periods';
import { LiveStats } from '@/components/solar/live-stats';
import { MonthlyChart } from '@/components/solar/monthly-chart';
import { YearlyGridChart } from '@/components/solar/yearly-grid-chart';
import {
  Typography,
  Box,
  Link as MuiLink,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PowerIcon from '@mui/icons-material/Power';
import SavingsIcon from '@mui/icons-material/Savings';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Revalidate every 5 minutes to reduce API rate limiting
export const revalidate = 300;

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

// Type for fetch result with potential error
type DataResult<T> = { data: T; error?: string };

// Helper function to capture errors instead of swallowing them
async function fetchWithError<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  name: string
): Promise<DataResult<T>> {
  try {
    const data = await fetcher();
    return { data };
  } catch (err) {
    console.error(`[SolarPage] ${name} failed:`, err);
    return { data: fallback, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

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
  const [
    solarData,
    last7DaysResult,
    last24MonthsResult,
    autarkieResult,
    peakPowerResult,
    yearlyGridResult
  ] = await Promise.all([
    getCachedOrFetch('solar-data', () => getSolarData()),
    getCachedOrFetch('last-7-days', () => fetchWithError(fetchLast7Days, [], 'Last 7 Days')),
    getCachedOrFetch('last-24-months', () => fetchWithError(fetchLast24Months, [], 'Last 24 Months')),
    getCachedOrFetch('autarkie-stats', () => fetchWithError(fetchAutarkieStats, null, 'Autarkie Stats')),
    getCachedOrFetch('peak-power-30d', () => fetchWithError(fetchLast30DaysPeakPower, [], 'Peak Power')),
    getCachedOrFetch('yearly-grid-import', () => fetchWithError(fetchLast5YearsGridImport, [], 'Yearly Grid')),
  ]);

  // Extract data from results
  const last7Days = last7DaysResult.data;
  const last24Months = last24MonthsResult.data;
  const autarkieStats = autarkieResult.data;
  const peakPowerHistory = peakPowerResult.data;
  const yearlyGridImport = yearlyGridResult.data;

  // Collect errors for display
  const dataErrors = [
    last7DaysResult.error && 'Letzte 7 Tage',
    last24MonthsResult.error && 'Monatsdaten',
    autarkieResult.error && 'Autarkie-Statistik',
    peakPowerResult.error && 'Spitzenleistung',
    yearlyGridResult.error && 'Jahres-Netzbezug',
  ].filter(Boolean) as string[];

  if (!solarData || 'error' in solarData) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
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
  const last7DaysRows = [...last7Days].reverse().map((item) => {
    return {
      timestamp: new Date(item.timestamp).toLocaleDateString('de-DE'),
      total_solar_yield: `${item.total_solar_yield.toFixed(2)} kWh`,
      total_consumption: `${item.total_consumption.toFixed(2)} kWh`,
    };
  });

  const monthlyDataRows = last24Months.slice(0, 12).map((item) => {
    return {
      timestamp: new Date(item.timestamp).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
      total_solar_yield: `${item.total_solar_yield.toFixed(2)} kWh`,
      total_consumption: `${item.total_consumption.toFixed(2)} kWh`,
      grid_history_from: `${item.grid_history_from.toFixed(2)} kWh`,
    };
  });

  // Prepare grid periods table data
  const gridPeriods = getGridPeriods();
  const gridPeriodsRows = gridPeriods.map((period) => {
    const days = calculateDays(period.gridOn, period.gridOff);
    const isActive = isActivePeriod(period);

    return {
      gridOn: new Date(period.gridOn).toLocaleDateString('de-DE'),
      gridOff: isActive
        ? '🔌 Noch am Netz'
        : new Date(period.gridOff!).toLocaleDateString('de-DE'),
      days: `${days} ${days === 1 ? 'Tag' : 'Tage'}`,
      status: isActive ? '🔴 Aktiv' : '✅ Abgeschlossen',
    };
  }).reverse(); // Newest first


  // Calculate peak power for today
  const todayPeak = peakPowerHistory[0]?.peak_power || 0;

  // Calculate costs based on electricity prices
  const todayCosts = calculateDailyCosts(
    processed.todayConsumption,
    0 // We don't have today's grid import in processed data, will show yearly costs instead
  );

  const yearlyCosts = autarkieStats
    ? calculateYearlyCosts(autarkieStats.total_consumption, autarkieStats.grid_history_from)
    : null;

  return (
    <Box sx={{ overflowX: 'hidden' }}>
        {/* Error Alert for missing data */}
        {dataErrors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Einige Daten konnten nicht geladen werden: {dataErrors.join(', ')}
          </Alert>
        )}

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
              <WbSunnyIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'warning.main' }} />
              <Box>
                <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                  {autarkieStats.total_solar_yield.toFixed(0)}
                  <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                    kWh
                  </Typography>
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Solar Ertrag (Jahr)
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
              <ElectricBoltIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'info.main' }} />
              <Box>
                <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                  {autarkieStats.total_consumption.toFixed(0)}
                  <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                    kWh
                  </Typography>
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Verbrauch (Jahr)
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
              <PowerIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'error.main' }} />
              <Box>
                <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                  {autarkieStats.grid_history_from.toFixed(0)}
                  <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                    kWh
                  </Typography>
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Netzbezug (Jahr)
                </Typography>
              </Box>
            </Paper>
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
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                background:
                  'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                📅 Letzte 11 Tage
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Datum</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Ertrag</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Verbrauch</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {last7DaysRows.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.timestamp}</TableCell>
                        <TableCell align="right">{row.total_solar_yield}</TableCell>
                        <TableCell align="right">{row.total_consumption}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          {last24Months.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                background:
                  'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                📊 Monatliche Daten
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Monat</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Solar Ertrag</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Verbrauch</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Nachbar-Strom</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyDataRows.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.timestamp}</TableCell>
                        <TableCell align="right">{row.total_solar_yield}</TableCell>
                        <TableCell align="right">{row.total_consumption}</TableCell>
                        <TableCell align="right">{row.grid_history_from}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>

        {/* Grid Periods Table */}
        {gridPeriodsRows.length > 0 && (
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 4,
              background:
                'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              🔌 Netzstrom-Perioden
            </Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Grid On</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Grid Off</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Anzahl Tage</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gridPeriodsRows.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{row.gridOn}</TableCell>
                      <TableCell>{row.gridOff}</TableCell>
                      <TableCell align="right">{row.days}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Monthly Yield Chart */}
        {monthlyChartData.length > 0 && (
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 4,
              overflow: 'hidden',
              background:
                'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📈 Monatlicher Ertrag
            </Typography>
            <Box sx={{ height: 350, width: '100%', overflow: 'hidden' }}>
              <MonthlyChart data={monthlyChartData} />
            </Box>
          </Paper>
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
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                ⚡ Spitzenleistungen der letzten 30 Tage
              </Typography>
              <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
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
              </Box>
            </Paper>
          )}

          {yearlyGridImport.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🔌 Strombezug von extern der letzten 5 Jahre
              </Typography>
              <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
                <YearlyGridChart data={yearlyGridImport} />
              </Box>
            </Paper>
          )}
        </Box>

        {/* Electricity Costs & Savings */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            💰 Stromkosten & Einsparungen
          </Typography>

          {/* Yearly Cost Breakdown Table */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 4,
              background:
                'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📊 Kosten pro Jahr
            </Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Jahr</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Verbrauch</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Nachbar-Strom</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Eigenverbrauch</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Kosten</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Einsparungen</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Ersparnis %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {yearlyGridImport
                    .map((item) => {
                      const gridImport = item.gridImport || 0;
                      const consumption = autarkieStats
                        ? gridImport / (1 - autarkieStats.autarkie / 100)
                        : gridImport;
                      const costs = calculateYearlyCosts(consumption, gridImport);
                      return {
                        year: item.year,
                        consumption: `${consumption.toFixed(0)} kWh`,
                        gridImport: `${gridImport.toFixed(0)} kWh`,
                        selfConsumption: `${costs.selfConsumption.toFixed(0)} kWh`,
                        costs: formatCurrency(costs.neighborCost),
                        savings: formatCurrency(costs.solarSavings),
                        savingsPercent: `${((costs.solarSavings / costs.costWithoutSolar) * 100).toFixed(0)}%`,
                      };
                    })
                    .reverse()
                    .map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.year}</TableCell>
                        <TableCell align="right">{row.consumption}</TableCell>
                        <TableCell align="right">{row.gridImport}</TableCell>
                        <TableCell align="right">{row.selfConsumption}</TableCell>
                        <TableCell align="right">{row.costs}</TableCell>
                        <TableCell align="right">{row.savings}</TableCell>
                        <TableCell align="right">{row.savingsPercent}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Current Year Summary Cards */}
          {yearlyCosts && (
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
                <PowerIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'error.main' }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {formatCurrency(yearlyCosts.neighborCost)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date().getFullYear()}: Kosten Nachbar-Strom
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {autarkieStats?.grid_history_from.toFixed(0)} kWh × {ELECTRICITY_PRICE_RAPPEN} Rp
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
                <SavingsIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'success.main' }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {formatCurrency(yearlyCosts.solarSavings)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date().getFullYear()}: Solar-Einsparungen
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {yearlyCosts.selfConsumption.toFixed(0)} kWh Eigenverbrauch
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
                <ElectricBoltIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'warning.main' }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {formatCurrency(yearlyCosts.costWithoutSolar)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date().getFullYear()}: Kosten ohne Solar
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hypothetische Gesamtkosten
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
                <SavingsIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'success.main' }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {formatCurrency(yearlyCosts.solarSavings)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date().getFullYear()}: Total gespart
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((yearlyCosts.solarSavings / yearlyCosts.costWithoutSolar) * 100).toFixed(0)}% Ersparnis
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Info Alert */}
          <Alert severity="info" icon={<InfoIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Strom vom Nachbarn: {ELECTRICITY_PRICE_RAPPEN} Rp/kWh
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Basierend auf Schweizer Durchschnittspreis (nicht am öffentlichen Netz angeschlossen)
                </Typography>
              </Box>
              <MuiLink
                href={ELECTRICITY_PRICE_SOURCE}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <Typography variant="body2">Referenz: ElCom</Typography>
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </MuiLink>
            </Box>
          </Alert>
        </Box>
    </Box>
  );
}
