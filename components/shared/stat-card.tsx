/**
 * StatCard Component
 * Reusable card for displaying simple statistics
 */

'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

// Color to rgba mapping for gradients
const colorToRgba: Record<string, { start: string; end: string }> = {
  primary: { start: 'rgba(25, 118, 210, 0.1)', end: 'rgba(25, 118, 210, 0.05)' },
  secondary: { start: 'rgba(156, 39, 176, 0.1)', end: 'rgba(156, 39, 176, 0.05)' },
  success: { start: 'rgba(102, 187, 106, 0.1)', end: 'rgba(102, 187, 106, 0.05)' },
  error: { start: 'rgba(239, 83, 80, 0.1)', end: 'rgba(239, 83, 80, 0.05)' },
  warning: { start: 'rgba(255, 167, 38, 0.1)', end: 'rgba(255, 167, 38, 0.05)' },
  info: { start: 'rgba(66, 165, 245, 0.1)', end: 'rgba(66, 165, 245, 0.05)' },
};

export function StatCard({ title, value, icon, subtitle, color = 'primary' }: StatCardProps) {
  const gradientColors = colorToRgba[color] || colorToRgba.primary;

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${gradientColors.start} 0%, ${gradientColors.end} 100%)`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {icon && (
            <Box sx={{ color: `${color}.main`, '& .MuiSvgIcon-root': { fontSize: { xs: 40, sm: 48, md: 64 } } }}>
              {icon}
            </Box>
          )}
          <Box>
            <Typography
              component="div"
              sx={{ fontWeight: 700, lineHeight: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
            >
              {value}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
