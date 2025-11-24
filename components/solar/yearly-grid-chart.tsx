/**
 * Yearly Grid Import Chart Component
 * Client component for rendering the yearly grid import bar chart
 */

'use client';

import { BarChart } from '@mui/x-charts/BarChart';

interface YearlyGridChartProps {
  data: Array<{
    year: string;
    gridImport: number;
  }>;
}

export function YearlyGridChart({ data }: YearlyGridChartProps) {
  // Safety check for empty or invalid data
  if (!data || data.length === 0) {
    return <div>Keine Daten verfügbar</div>;
  }

  return (
    <BarChart
      dataset={data}
      xAxis={[{ dataKey: 'year' }]}
      series={[
        {
          dataKey: 'gridImport',
          label: 'Strombezug von extern (kWh)',
          color: '#ec4899',
        },
      ]}
      height={300}
    />
  );
}
