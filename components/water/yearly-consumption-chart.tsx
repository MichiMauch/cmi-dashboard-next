/**
 * Yearly Water Consumption Chart
 * Shows consumption per year with Swiss average reference line
 */

'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Chip } from '@mui/material';
import { YearlyConsumption, SWISS_AVERAGE_YEARLY, HOUSEHOLD_SIZE } from '@/lib/water-data';

interface YearlyConsumptionChartProps {
  data: YearlyConsumption[];
}

export function YearlyConsumptionChart({ data }: YearlyConsumptionChartProps) {
  if (!data || data.length === 0) {
    return <Box>Keine Daten verfügbar</Box>;
  }

  const swissAverageForHousehold = SWISS_AVERAGE_YEARLY * HOUSEHOLD_SIZE;

  // Prepare chart data
  const chartData = data.map((item) => ({
    year: item.year,
    consumption: item.consumption,
    average: swissAverageForHousehold,
    isComplete: item.isComplete,
  }));

  return (
    <Box>
      <BarChart
        dataset={chartData}
        xAxis={[
          {
            scaleType: 'band',
            dataKey: 'year',
            categoryGapRatio: 0.3,
            barGapRatio: 0.1,
          },
        ]}
        yAxis={[
          {
            label: 'Wasserverbrauch (m³)',
          },
        ]}
        series={[
          {
            dataKey: 'consumption',
            label: 'Ihr Verbrauch',
            color: '#0ea5e9',
            valueFormatter: (value, context) => {
              const item = chartData[context.dataIndex];
              if (!item.isComplete) {
                return `${value} m³ (unvollständig)`;
              }
              return `${value} m³`;
            },
          },
        ]}
        height={350}
      />
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip label="2022: Einzug September - unvollständige Daten" size="small" color="warning" variant="outlined" />
        <Chip label="Schweizer Durchschnitt: 102,2 m³/Jahr (2 Personen)" size="small" color="info" variant="outlined" />
      </Box>
    </Box>
  );
}
