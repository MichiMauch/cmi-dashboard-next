/**
 * GaugeCard Component
 * Card displaying a gauge/progress indicator with value
 */

'use client';

import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';

interface GaugeCardProps {
  title: string;
  value: number;
  maxValue?: number;
  unit?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
}

export function GaugeCard({
  title,
  value,
  maxValue = 100,
  unit,
  color = 'primary',
  thresholds
}: GaugeCardProps) {
  // Calculate percentage
  const percentage = Math.min((value / maxValue) * 100, 100);

  // Determine color based on thresholds if provided
  let gaugeColor = color;
  if (thresholds) {
    if (value < thresholds.low) {
      gaugeColor = 'error';
    } else if (value < thresholds.medium) {
      gaugeColor = 'warning';
    } else if (value >= thresholds.high) {
      gaugeColor = 'error';
    } else {
      gaugeColor = 'success';
    }
  }

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
          {title}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            my: 2
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            {/* Background circle */}
            <CircularProgress
              variant="determinate"
              value={100}
              size={120}
              thickness={4}
              sx={{
                color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              }}
            />
            {/* Value circle */}
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={120}
              thickness={4}
              color={gaugeColor}
              sx={{
                position: 'absolute',
                left: 0,
              }}
            />
            {/* Center text */}
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" component="div" color={`${gaugeColor}.main`} sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
              {unit && (
                <Typography variant="caption" color="text.secondary">
                  {unit}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
