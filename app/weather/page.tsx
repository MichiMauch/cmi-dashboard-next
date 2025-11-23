/**
 * Weather Page
 * Weather monitoring and forecast (placeholder)
 */

'use client';

import { Container, Typography, Paper, Box } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

export default function WeatherPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            backgroundColor: 'background.default',
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <WbSunnyIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom color="text.primary">
            Wetter
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center">
            Wetterinformationen und -vorhersage
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            Dieser Bereich wird Wetterdaten und Prognosen anzeigen.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
