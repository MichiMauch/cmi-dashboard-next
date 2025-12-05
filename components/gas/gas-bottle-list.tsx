/**
 * Gas Bottle List Component
 * Shows history of all gas bottles with statistics
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface GasBottle {
  _id: string;
  type: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

interface GasBottleListProps {
  bottles: GasBottle[];
  onBottleUpdated: () => void;
}

function calculateDays(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function GasBottleList({ bottles, onBottleUpdated }: GasBottleListProps) {
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState<GasBottle | null>(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const activeBottle = bottles.find((b) => !b.endDate);
  const completedBottles = bottles.filter((b) => b.endDate);

  // Calculate statistics
  const completedDays = completedBottles.map((b) =>
    calculateDays(b.startDate, b.endDate)
  );
  const avgDays =
    completedDays.length > 0
      ? Math.round(completedDays.reduce((a, b) => a + b, 0) / completedDays.length)
      : 0;

  const handleEndBottle = async () => {
    if (!selectedBottle) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/gas/${selectedBottle._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren');
      }

      setEndDialogOpen(false);
      setSelectedBottle(null);
      onBottleUpdated();
    } catch (error) {
      console.error('Error ending bottle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBottle = async () => {
    if (!selectedBottle) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/gas/${selectedBottle._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen');
      }

      setDeleteDialogOpen(false);
      setSelectedBottle(null);
      onBottleUpdated();
    } catch (error) {
      console.error('Error deleting bottle:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Active Bottle */}
      {activeBottle && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h5" gutterBottom>
            Aktive Gasflasche
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {calculateDays(activeBottle.startDate)} Tage
              </Typography>
              <Typography variant="body1">
                In Betrieb seit {formatDate(activeBottle.startDate)}
              </Typography>
              {activeBottle.notes && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  {activeBottle.notes}
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                setSelectedBottle(activeBottle);
                setEndDate(new Date().toISOString().split('T')[0]);
                setEndDialogOpen(true);
              }}
            >
              Flasche leer
            </Button>
          </Box>
        </Paper>
      )}

      {/* Statistics */}
      {completedBottles.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Statistiken
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="h4" color="primary">
                {avgDays} Tage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Durchschnittliche Nutzungsdauer
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="primary">
                {completedBottles.length + (activeBottle ? 1 : 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Flaschen insgesamt
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* History Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Historie
        </Typography>

        {bottles.length === 0 ? (
          <Typography color="text.secondary">
            Noch keine Gasflaschen erfasst.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Typ</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>Ende</TableCell>
                  <TableCell align="right">Betriebstage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bottles.map((bottle) => (
                  <TableRow key={bottle._id}>
                    <TableCell>{bottle.type}</TableCell>
                    <TableCell>{formatDate(bottle.startDate)}</TableCell>
                    <TableCell>
                      {bottle.endDate ? formatDate(bottle.endDate) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {calculateDays(bottle.startDate, bottle.endDate)} Tage
                    </TableCell>
                    <TableCell>
                      {bottle.endDate ? (
                        <Chip
                          label="Leer"
                          size="small"
                          color="default"
                          icon={<CheckCircleIcon />}
                        />
                      ) : (
                        <Chip
                          label="Aktiv"
                          size="small"
                          color="success"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedBottle(bottle);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* End Bottle Dialog */}
      <Dialog open={endDialogOpen} onClose={() => setEndDialogOpen(false)}>
        <DialogTitle>Gasflasche als leer markieren</DialogTitle>
        <DialogContent>
          <TextField
            label="Enddatum"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleEndBottle}
            variant="contained"
            disabled={loading}
          >
            Bestätigen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Gasflasche löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du diese Gasflasche wirklich löschen? Diese Aktion kann nicht
            rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleDeleteBottle}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
