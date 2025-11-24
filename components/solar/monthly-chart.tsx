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

  // Debug: Log data to console to see what we're receiving
  console.log('[MonthlyChart] Rendering with data:', JSON.stringify(data, null, 2));
  console.log('[MonthlyChart] Consumption values:', data.map(d => ({ month: d.month, consumption: d.consumption })));

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
