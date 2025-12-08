/**
 * Heating Status Chip Component
 * Shows oven status in the header
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Chip, Skeleton } from '@mui/material';

type OvenState = 'cold' | 'warming' | 'hot' | 'cooling';

const STATE_CONFIG: Record<OvenState, { label: string; color: 'info' | 'warning' | 'error' | 'success' }> = {
  cold: { label: '❄️ KALT', color: 'info' },
  warming: { label: '📈 AUFWÄRMEN', color: 'warning' },
  hot: { label: '🔥 HEISS', color: 'error' },
  cooling: { label: '📉 ABKÜHLEN', color: 'success' },
};

export function HeatingStatusChip() {
  const [state, setState] = useState<OvenState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/data', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setState(data.oven_state?.state || 'cold');
        }
      } catch (error) {
        console.error('Error fetching heating status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Skeleton variant="rounded" width={100} height={32} />;
  }

  if (!state) {
    return null;
  }

  const config = STATE_CONFIG[state];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}
