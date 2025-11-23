/**
 * Dashboard Home Page
 * Main dashboard overview with laundry forecast
 */

'use client';

import { Container, Typography, Box, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import ThermostatIcon from '@mui/icons-material/Thermostat';

interface LaundryForecast {
  bestDay: {
    date: string;
    dayName: string;
    timeWindow: string;
  };
  reasoning: string;
  weatherSummary: {
    temperature: string;
    humidity: string;
    rain: string;
  };
}

export default function DashboardPage() {
  const [forecast, setForecast] = useState<LaundryForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const response = await fetch('/api/laundry-forecast');
        if (!response.ok) {
          throw new Error('Failed to fetch forecast');
        }
        const data = await response.json();
        setForecast(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            mb: 4,
          }}
        >
          Dashboard
        </Typography>

        {/* Laundry Forecast Card */}
        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  backgroundColor: 'primary.main',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <Typography variant="h4">👕</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Wäsche aufhängen - Beste Gelegenheit
              </Typography>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Fehler beim Laden der Vorhersage: {error}
              </Alert>
            )}

            {forecast && !loading && !error && (
              <Box>
                {/* Best Day Highlight */}
                <Box
                  sx={{
                    backgroundColor: 'success.main',
                    color: 'success.contrastText',
                    borderRadius: 2,
                    p: 3,
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {forecast.bestDay.dayName}
                      </Typography>
                      <Typography variant="h6">{forecast.bestDay.date}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 1 }}>
                    <strong>Empfohlenes Zeitfenster:</strong> {forecast.bestDay.timeWindow}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {forecast.reasoning}
                  </Typography>
                </Box>

                {/* Weather Summary */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ThermostatIcon sx={{ fontSize: 32, mr: 1.5, color: 'error.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Temperatur
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {forecast.weatherSummary.temperature}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <OpacityIcon sx={{ fontSize: 32, mr: 1.5, color: 'info.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Luftfeuchtigkeit
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {forecast.weatherSummary.humidity}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <WbSunnyIcon sx={{ fontSize: 32, mr: 1.5, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Regenwahrscheinlichkeit
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {forecast.weatherSummary.rain}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
