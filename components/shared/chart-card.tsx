/**
 * ChartCard Component
 * Wrapper card for charts with title and optional subtitle
 */

'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number;
}

export function ChartCard({ title, subtitle, children, height = 300 }: ChartCardProps) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ height, width: '100%' }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}
