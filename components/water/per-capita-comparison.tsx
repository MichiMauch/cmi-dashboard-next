/**
 * Per Capita Water Consumption Comparison
 * Compares your daily consumption per person to Swiss average
 */

'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography } from '@mui/material';

interface PerCapitaComparisonProps {
  yourDailyLiters: number;
  averageDailyLiters: number;
}

export function PerCapitaComparison({ yourDailyLiters, averageDailyLiters }: PerCapitaComparisonProps) {
  const data = [
    {
      category: 'Ihr Verbrauch',
      liters: yourDailyLiters,
      color: '#10b981', // Green for efficient
    },
    {
      category: 'CH-Durchschnitt',
      liters: averageDailyLiters,
      color: '#ef4444', // Red for average
    },
  ];

  const savingsPercent = ((averageDailyLiters - yourDailyLiters) / averageDailyLiters) * 100;

  return (
    <Box>
      <BarChart
        dataset={data}
        xAxis={[
          {
            scaleType: 'band',
            dataKey: 'category',
          },
        ]}
        yAxis={[
          {
            label: 'Liter pro Person pro Tag',
          },
        ]}
        series={[
          {
            dataKey: 'liters',
            label: 'Täglicher Verbrauch',
            valueFormatter: (value) => `${value?.toFixed(1)} L`,
            color: '#0ea5e9',
          },
        ]}
        height={300}
        margin={{ left: 80 }}
      />
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
          Sie verbrauchen {savingsPercent.toFixed(1)}% weniger als der Durchschnitt! 🎉
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Einsparung: {(averageDailyLiters - yourDailyLiters).toFixed(1)} Liter pro Person pro Tag
        </Typography>
      </Box>
    </Box>
  );
}
