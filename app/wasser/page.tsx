/**
 * Water Consumption Page
 * Displays water usage statistics and comparison to Swiss average
 */

import { Container, Typography, Box, Card, CardContent, Link as MuiLink, Alert } from '@mui/material';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { DataTable, DataTableColumn } from '@/components/shared/data-table';
import { GaugeCard } from '@/components/shared/gauge-card';
import { YearlyConsumptionChart } from '@/components/water/yearly-consumption-chart';
import { PerCapitaComparison } from '@/components/water/per-capita-comparison';
import { UsageBreakdownChart } from '@/components/water/usage-breakdown-chart';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  yearlyConsumption,
  usageBreakdown,
  getCurrentYearStats,
  getYourUsageBreakdown,
  SWISS_AVERAGE_DAILY,
  SOURCE_INFO,
} from '@/lib/water-data';

export const revalidate = 86400; // Revalidate once per day

export default function WaterPage() {
  const currentStats = getCurrentYearStats();

  if (!currentStats) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            ⚠️ Keine vollständigen Daten verfügbar
          </Typography>
        </Box>
      </Container>
    );
  }

  const yourUsageBreakdown = getYourUsageBreakdown(currentStats.dailyPerPerson);
  const completeYears = yearlyConsumption.filter((y) => y.isComplete);

  // Prepare table data
  const tableRows = yearlyConsumption.map((item) => {
    const dailyPerPerson = item.isComplete ? (item.consumption * 1000) / 365 / 2 : null;
    const comparison = dailyPerPerson ? ((dailyPerPerson - SWISS_AVERAGE_DAILY) / SWISS_AVERAGE_DAILY) * 100 : null;

    return {
      year: item.year,
      total: `${item.consumption} m³`,
      perPerson: dailyPerPerson ? `${dailyPerPerson.toFixed(1)} L/Tag` : '-',
      comparison: comparison
        ? `${comparison.toFixed(1)}% ${comparison < 0 ? '🌟' : ''}`
        : '-',
      status: item.isComplete ? '✓ Vollständig' : `⚠ ${item.note}`,
    };
  }).reverse(); // Newest first

  const tableColumns: DataTableColumn[] = [
    { id: 'year', label: 'Jahr' },
    { id: 'total', label: 'Total', align: 'right' },
    { id: 'perPerson', label: 'Pro Person/Tag', align: 'right' },
    { id: 'comparison', label: 'vs. CH-Ø', align: 'right' },
    { id: 'status', label: 'Status' },
  ];

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
              background: 'linear-gradient(to right, #0ea5e9, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
          >
            💧 Wasserverbrauch
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Unser Verbrauch im Vergleich zum Schweizer Durchschnitt
          </Typography>
        </Box>

        {/* Key Statistics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <StatCard
            title="Verbrauch 2024"
            value={`${currentStats.totalM3} m³`}
            subtitle="Total für 2 Personen"
            icon={<WaterDropIcon />}
            color="info"
          />
          <StatCard
            title="Pro Person & Tag"
            value={`${currentStats.dailyPerPerson.toFixed(1)} L`}
            subtitle={`${currentStats.yearlyPerPerson.toFixed(1)} m³ pro Jahr`}
            icon={<WaterDropIcon />}
            color="primary"
          />
          <StatCard
            title="Einsparung"
            value={`${Math.abs(currentStats.comparisonPercent).toFixed(1)}%`}
            subtitle="unter CH-Durchschnitt"
            icon={<TrendingDownIcon />}
            color="success"
          />
          <StatCard
            title="Kostenersparnis"
            value={`~${currentStats.costSavings.toFixed(0)} CHF`}
            subtitle="pro Jahr (2 CHF/m³)"
            icon={<SavingsIcon />}
            color="warning"
          />
        </Box>

        {/* Efficiency Champion Badge */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <GaugeCard
            title="Wasser-Effizienz"
            value={Math.abs(currentStats.comparisonPercent)}
            maxValue={100}
            unit="% Einsparung"
            thresholds={{ low: 20, medium: 50, high: 100 }}
          />
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <EmojiEventsIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Wasser-Effizienz-Meister!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Wir verbrauchen nur <strong>{(currentStats.dailyPerPerson / SWISS_AVERAGE_DAILY * 100).toFixed(1)}%</strong> des
                  Schweizer Durchschnitts
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  Jährliche Einsparung: {currentStats.savingsM3.toFixed(1)} m³ (~{currentStats.costSavings.toFixed(0)} CHF)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Yearly Consumption Chart */}
        <Box sx={{ mb: 4 }}>
          <ChartCard title="Jährlicher Wasserverbrauch" height={400}>
            <YearlyConsumptionChart data={yearlyConsumption} />
          </ChartCard>
        </Box>

        {/* Comparison Charts */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <ChartCard title="Pro-Kopf-Vergleich" height={380}>
            <PerCapitaComparison
              yourDailyLiters={currentStats.dailyPerPerson}
              averageDailyLiters={SWISS_AVERAGE_DAILY}
            />
          </ChartCard>

          <ChartCard title="Verwendung des Wassers" height={380}>
            <UsageBreakdownChart
              averageBreakdown={usageBreakdown}
              yourBreakdown={yourUsageBreakdown}
              showComparison={false}
            />
          </ChartCard>
        </Box>

        {/* Detailed Breakdown Table */}
        <Box sx={{ mb: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Detaillierte Verwendungsaufschlüsselung
              </Typography>
              <UsageBreakdownChart
                averageBreakdown={usageBreakdown}
                yourBreakdown={yourUsageBreakdown}
                showComparison={true}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Key Insights */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEventsIcon color="success" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Wichtige Erkenntnisse
                </Typography>
              </Box>
              <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li>
                  <Typography variant="body2">
                    <strong>Herausragend effizient:</strong> Nur {(currentStats.dailyPerPerson / SWISS_AVERAGE_DAILY * 100).toFixed(1)}% des Schweizer
                    Durchschnitts
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Jährliche Einsparung:</strong> {currentStats.savingsM3.toFixed(1)} m³ für Ihren 2-Personen-Haushalt
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Kostenersparnis:</strong> Rund {currentStats.costSavings.toFixed(0)} CHF pro Jahr (bei 2 CHF/m³)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Trend 2023-2024:</strong> Stabil bei ~24-25 m³ pro Jahr
                  </Typography>
                </li>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InfoIcon color="info" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Wasserspar-Tipps
                </Typography>
              </Box>
              <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li>
                  <Typography variant="body2">Duschen statt Baden spart bis zu 50% Wasser</Typography>
                </li>
                <li>
                  <Typography variant="body2">Regenwasser für Gartenbewässerung nutzen</Typography>
                </li>
                <li>
                  <Typography variant="body2">Tropfende Wasserhähne sofort reparieren</Typography>
                </li>
                <li>
                  <Typography variant="body2">Wasch- und Geschirrspülmaschine nur voll beladen</Typography>
                </li>
                <li>
                  <Typography variant="body2">Sparduschkopf installieren (6-9 L/Min statt 12-15 L/Min)</Typography>
                </li>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Data Table */}
        <Box sx={{ mb: 4 }}>
          <DataTable title="Jahresübersicht" columns={tableColumns} rows={tableRows} />
        </Box>

        {/* Source Information */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {SOURCE_INFO.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {SOURCE_INFO.description}
              </Typography>
            </Box>
            <MuiLink
              href={SOURCE_INFO.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Typography variant="body2">Weitere Informationen</Typography>
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </MuiLink>
          </Box>
        </Alert>
      </Box>
    </Container>
  );
}
