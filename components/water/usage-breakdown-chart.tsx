/**
 * Water Usage Breakdown Chart
 * Shows how water is used (WC, shower, cooking, etc.)
 */

'use client';

import { PieChart } from '@mui/x-charts/PieChart';
import { Box, Typography, Divider } from '@mui/material';
import { WaterUsageBreakdown } from '@/lib/water-data';

interface UsageBreakdownChartProps {
  averageBreakdown: WaterUsageBreakdown[];
  yourBreakdown: WaterUsageBreakdown[];
  showComparison?: boolean;
}

export function UsageBreakdownChart({
  averageBreakdown,
  yourBreakdown,
  showComparison = true,
}: UsageBreakdownChartProps) {
  // Prepare data for PieChart
  const chartData = averageBreakdown.map((item, index) => ({
    id: index,
    value: item.liters,
    label: item.category,
  }));

  const colors = [
    '#3b82f6', // WC
    '#06b6d4', // Bad/Dusche
    '#0ea5e9', // Kochen
    '#8b5cf6', // Waschmaschine
    '#10b981', // Körperpflege
    '#f59e0b', // Geschirrspüler
    '#ef4444', // Anderes
    '#6366f1', // Trinkwasser
  ];

  return (
    <Box>
      <PieChart
        series={[
          {
            data: chartData,
            valueFormatter: (item) => `${item.value} L (${((item.value / 140) * 100).toFixed(1)}%)`,
          },
        ]}
        colors={colors}
        height={300}
      />

      {showComparison && (
        <Box sx={{ mt: 3, px: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Schweizer Durchschnitt vs. Unser geschätzter Verbrauch
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 1, fontSize: '0.875rem' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Verwendung</Typography>
            <Typography variant="body2" color="text.secondary" align="right" sx={{ fontWeight: 600 }}>CH-Ø</Typography>
            <Typography variant="body2" color="text.secondary" align="right" sx={{ fontWeight: 600 }}>Wir</Typography>

            {averageBreakdown.map((item, idx) => (
              <Box key={idx} sx={{ display: 'contents' }}>
                <Typography variant="body2">{item.category}</Typography>
                <Typography variant="body2" align="right">{item.liters} L</Typography>
                <Typography variant="body2" align="right" color="success.main" sx={{ fontWeight: 600 }}>
                  ~{yourBreakdown[idx].liters} L
                </Typography>
              </Box>
            ))}

            <Box sx={{ display: 'contents', borderTop: '1px solid #e5e7eb', pt: 1, mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Total</Typography>
              <Typography variant="body2" align="right" sx={{ fontWeight: 600 }}>140 L</Typography>
              <Typography variant="body2" align="right" color="success.main" sx={{ fontWeight: 600 }}>
                ~{yourBreakdown.reduce((sum, item) => sum + item.liters, 0).toFixed(1)} L
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
