/**
 * Water Consumption Page
 * Displays water usage statistics and comparison to Swiss average
 */

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
import { YearlyConsumptionChart } from '@/components/water/yearly-consumption-chart';
import { PerCapitaComparison } from '@/components/water/per-capita-comparison';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  yearlyConsumption,
  getCurrentYearStats,
  SWISS_AVERAGE_DAILY,
  SOURCE_INFO,
} from '@/lib/water-data';

export const revalidate = 86400; // Revalidate once per day

export default function WaterPage() {
  const currentStats = getCurrentYearStats();

  if (!currentStats) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          ⚠️ Keine vollständigen Daten verfügbar
        </Typography>
      </Box>
    );
  }

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

  return (
    <Box sx={{ overflowX: 'hidden' }}>
        {/* Key Statistics */}
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
            <WaterDropIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'info.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {currentStats.totalM3}
                <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                  m³
                </Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Verbrauch 2024
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
            <WaterDropIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'primary.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {currentStats.dailyPerPerson.toFixed(1)}
                <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                  L/Tag
                </Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Pro Person & Tag
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
            <TrendingDownIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'success.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                {Math.abs(currentStats.comparisonPercent).toFixed(1)}
                <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                  %
                </Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Einsparung vs. CH-Ø
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
            <SavingsIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'warning.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                ~{currentStats.costSavings.toFixed(0)}
                <Typography component="span" sx={{ ml: 0.5, fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
                  CHF
                </Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Kostenersparnis/Jahr
              </Typography>
            </Box>
          </Paper>
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
              💧 Wasser-Effizienz
            </Typography>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' }, color: 'success.main' }}>
              {Math.abs(currentStats.comparisonPercent).toFixed(1)}%
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Einsparung vs. CH-Durchschnitt
            </Typography>
          </Paper>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Wasser-Effizienz-Meister!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Wir verbrauchen nur <strong>{(currentStats.dailyPerPerson / SWISS_AVERAGE_DAILY * 100).toFixed(1)}%</strong> des
              Schweizer Durchschnitts
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              Jährliche Einsparung: {currentStats.savingsM3.toFixed(1)} m³ (~{currentStats.costSavings.toFixed(0)} CHF)
            </Typography>
          </Paper>
        </Box>

        {/* Yearly Consumption Chart */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mb: 4,
            background:
              'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📊 Jährlicher Wasserverbrauch
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <YearlyConsumptionChart data={yearlyConsumption} />
          </Box>
        </Paper>

        {/* Pro-Kopf-Vergleich */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mb: 4,
            background:
              'linear-gradient(135deg, rgba(255, 167, 38, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            👥 Pro-Kopf-Vergleich
          </Typography>
          <Box sx={{ height: 380, width: '100%' }}>
            <PerCapitaComparison
              yourDailyLiters={currentStats.dailyPerPerson}
              averageDailyLiters={SWISS_AVERAGE_DAILY}
            />
          </Box>
        </Paper>

        {/* Key Insights */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              background:
                'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)',
            }}
          >
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
          </Paper>

          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              background:
                'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(66, 165, 245, 0.05) 100%)',
            }}
          >
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
          </Paper>
        </Box>

        {/* Data Table */}
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
            📅 Jahresübersicht
          </Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Jahr</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Pro Person/Tag</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">vs. CH-Ø</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.year}</TableCell>
                    <TableCell align="right">{row.total}</TableCell>
                    <TableCell align="right">{row.perPerson}</TableCell>
                    <TableCell align="right">{row.comparison}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

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
  );
}
