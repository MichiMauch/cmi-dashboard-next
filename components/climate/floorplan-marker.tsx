/**
 * FloorplanMarker Component
 * Displays temperature and humidity info at a specific position on the floorplan
 */

'use client';

import Link from 'next/link';
import { Typography, Box } from '@mui/material';

interface FloorplanMarkerProps {
  x: number; // % Position horizontal
  y: number; // % Position vertikal
  temperature: number;
  humidity: number;
  roomSlug: string;
  horizontal?: boolean; // Werte nebeneinander statt untereinander
}

export function FloorplanMarker({
  x,
  y,
  temperature,
  humidity,
  roomSlug,
  horizontal = false,
}: FloorplanMarkerProps) {
  return (
    <Link href={`/climate/${roomSlug}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          p: 1,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s ease-in-out',
          display: horizontal ? 'flex' : 'block',
          gap: horizontal ? 1 : 0,
          '&:hover': {
            transform: 'translate(-50%, -50%) scale(1.1)',
          },
        }}
      >
        <Typography color="error.main" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          {temperature.toFixed(1)}°
        </Typography>
        <Typography color="info.main" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          {humidity.toFixed(0)}%
        </Typography>
      </Box>
    </Link>
  );
}
