/**
 * Monthly Chart Component
 * Client component for rendering the monthly yield bar chart
 */

'use client';

import { BarChart } from '@mui/x-charts/BarChart';

interface MonthlyChartProps {
  data: Array<{
    month: string;
    yield: number;
    consumption: number;
    gridImport: number;
  }>;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  // Safety check for empty or invalid data
  if (!data || data.length === 0) {
    return <div>Keine Daten verfügbar</div>;
  }

  return (
    <BarChart
      dataset={data}
      xAxis={[
        {
          scaleType: 'band',
          dataKey: 'month',
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
      height={350}
    />
  );
}
