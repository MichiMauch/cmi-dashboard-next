/**
 * Solar Status Chip Component
 * Shows grid/autark status in the header
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Chip, Skeleton } from '@mui/material';
import PowerIcon from '@mui/icons-material/Power';
import BoltIcon from '@mui/icons-material/Bolt';

interface SolarStatus {
  isOnGrid: boolean;
}

export function SolarStatusChip() {
  const [status, setStatus] = useState<SolarStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/victron/stats?interval=15mins', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          // gridPower > 0 means using grid power
          const gridPower = data.processed?.gridPower || 0;
          setStatus({ isOnGrid: gridPower > 0 });
        }
      } catch (error) {
        console.error('Error fetching solar status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh every minute
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Skeleton variant="rounded" width={100} height={32} />;
  }

  if (!status) {
    return null;
  }

  return (
    <Chip
      icon={status.isOnGrid ? <PowerIcon /> : <BoltIcon />}
      label={status.isOnGrid ? 'Netzstrom' : 'Autark'}
      color={status.isOnGrid ? 'warning' : 'success'}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}
