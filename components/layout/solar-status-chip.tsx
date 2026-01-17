/**
 * Solar Status Chip Component
 * Shows grid/autark status in the header
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Chip, Skeleton } from '@mui/material';
import PowerIcon from '@mui/icons-material/Power';
import BoltIcon from '@mui/icons-material/Bolt';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import { GridStatus } from '@/types/victron';

interface SolarStatus {
  gridStatus: GridStatus;
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
          // Use new gridStatus field
          const gridStatus: GridStatus = data.processed?.gridStatus || 'unknown';
          setStatus({ gridStatus });
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

  // Determine display based on gridStatus
  const getChipProps = () => {
    switch (status.gridStatus) {
      case 'grid_consuming':
        return {
          icon: <PowerIcon />,
          label: 'Netzstrom',
          color: 'warning' as const
        };
      case 'grid_feeding':
        return {
          icon: <ElectricBoltIcon />,
          label: 'Einspeisung',
          color: 'info' as const
        };
      case 'autark':
        return {
          icon: <BoltIcon />,
          label: 'Autark',
          color: 'success' as const
        };
      default:
        return {
          icon: <BoltIcon />,
          label: 'Autark',
          color: 'success' as const
        };
    }
  };

  const chipProps = getChipProps();

  return (
    <Chip
      icon={chipProps.icon}
      label={chipProps.label}
      color={chipProps.color}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}
