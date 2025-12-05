/**
 * Gas Page
 * Tracks gas bottle usage with manual data entry
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { GasBottleForm } from '@/components/gas/gas-bottle-form';
import { GasBottleList } from '@/components/gas/gas-bottle-list';

interface GasBottle {
  _id: string;
  type: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export default function GasPage() {
  const [bottles, setBottles] = useState<GasBottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBottles = useCallback(async () => {
    try {
      const response = await fetch('/api/gas');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Daten');
      }
      const data = await response.json();
      setBottles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBottles();
  }, [fetchBottles]);

  const hasActiveBottle = bottles.some((b) => !b.endDate);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gasflaschen
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <GasBottleForm
            onBottleAdded={fetchBottles}
            hasActiveBottle={hasActiveBottle}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <GasBottleList
            bottles={bottles}
            onBottleUpdated={fetchBottles}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
