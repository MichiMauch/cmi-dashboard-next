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

export function StatCard({ title, value, icon, subtitle, color = 'primary' }: StatCardProps) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: `${color}.main` }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h4" component="div" color={`${color}.main`} sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
