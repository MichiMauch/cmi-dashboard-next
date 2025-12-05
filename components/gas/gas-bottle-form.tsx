/**
 * Gas Bottle Form Component
 * Form to add a new gas bottle
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface GasBottleFormProps {
  onBottleAdded: () => void;
  hasActiveBottle: boolean;
}

export function GasBottleForm({ onBottleAdded, hasActiveBottle }: GasBottleFormProps) {
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: '10.5kg',
          startDate,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      setNotes('');
      setStartDate(new Date().toISOString().split('T')[0]);
      onBottleAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Neue Gasflasche anschliessen
      </Typography>

      {hasActiveBottle && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Es ist bereits eine Gasflasche aktiv. Bitte zuerst die aktuelle Flasche als leer markieren.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Startdatum"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />

        <TextField
          label="Notizen (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          startIcon={<AddIcon />}
          disabled={loading || hasActiveBottle}
          fullWidth
        >
          {loading ? 'Wird erstellt...' : '10.5kg Flasche anschliessen'}
        </Button>
      </Box>
    </Paper>
  );
}
