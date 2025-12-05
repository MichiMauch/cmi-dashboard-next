/**
 * Climate Page
 * Displays temperature and humidity data from Shelly H&T Gen3 sensors
 */

import { Container, Box, Typography, Paper, Chip, Alert } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import { fetchShellySensors, getShellyDeviceIds, ShellySensorData, saveAllReadings } from '@/lib/shelly';
import { getRoomByDeviceId } from '@/lib/shelly-config';
import { ClimateHistory } from '@/components/climate/climate-history';

export const revalidate = 300; // Revalidate every 5 minutes

// Formatiert "2025-12-05 07:54:00" (UTC) zu lokaler Zeit "05.12.2025, 08:54"
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  // Parse as UTC and convert to local time
  const utcDate = new Date(dateStr.replace(' ', 'T') + 'Z');
  return utcDate.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getClimateData(): Promise<{ sensors: ShellySensorData[] } | { error: string }> {
  try {
    const deviceIds = getShellyDeviceIds();
    if (deviceIds.length === 0) {
      return { error: 'Keine Shelly Sensoren konfiguriert' };
    }
    const sensors = await fetchShellySensors(deviceIds);

    // Save readings to MongoDB (non-blocking, ignore errors)
    saveAllReadings(sensors).catch((err) => {
      console.error('[Climate Page] Error saving readings:', err);
    });

    return { sensors };
  } catch (error) {
    console.error('[Climate Page] Error fetching sensor data:', error);
    return { error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }
}

function SensorCard({ sensor }: { sensor: ShellySensorData }) {
  const batteryLow = sensor.battery < 20;
  const room = getRoomByDeviceId(sensor.id);
  const displayName = room?.name || sensor.name || `Sensor ${sensor.id.slice(-4).toUpperCase()}`;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: sensor.online
            ? 'linear-gradient(90deg, #00bcd4, #26c6da)'
            : 'linear-gradient(90deg, #9e9e9e, #bdbdbd)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {displayName}
        </Typography>
        <Chip
          label={sensor.online ? 'Online' : 'Offline'}
          color={sensor.online ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {/* Temperature */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 2,
        }}
      >
        <ThermostatIcon sx={{ fontSize: 40, color: 'error.main' }} />
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {sensor.temperature.toFixed(1)}
            <Typography component="span" variant="h5" sx={{ ml: 0.5 }}>
              °C
            </Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Temperatur
          </Typography>
        </Box>
      </Box>

      {/* Humidity */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 2,
        }}
      >
        <WaterDropIcon sx={{ fontSize: 40, color: 'info.main' }} />
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {sensor.humidity.toFixed(1)}
            <Typography component="span" variant="h5" sx={{ ml: 0.5 }}>
              %
            </Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Luftfeuchtigkeit
          </Typography>
        </Box>
      </Box>

      {/* Footer Info */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 'auto',
          pt: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {/* Battery */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {batteryLow ? (
            <BatteryAlertIcon sx={{ color: 'error.main', fontSize: 20 }} />
          ) : (
            <BatteryFullIcon sx={{ color: 'success.main', fontSize: 20 }} />
          )}
          <Typography variant="body2" color={batteryLow ? 'error.main' : 'text.secondary'}>
            {sensor.battery}%
          </Typography>
        </Box>

        {/* WiFi Signal */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SignalWifi4BarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {sensor.wifiSignal} dBm
          </Typography>
        </Box>

        {/* Last Update */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(sensor.lastUpdate)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default async function ClimatePage() {
  const data = await getClimateData();

  if ('error' in data) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{data.error}</Alert>
        </Box>
      </Container>
    );
  }

  const { sensors } = data;

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              background: 'linear-gradient(135deg, #00bcd4 0%, #26c6da 50%, #4dd0e1 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Klima inHouse
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Temperatur und Luftfeuchtigkeit in Echtzeit
          </Typography>
        </Box>

        {/* Sensor Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: `repeat(${Math.min(sensors.length, 4)}, 1fr)`,
            },
            gap: 3,
          }}
        >
          {sensors.map((sensor) => (
            <SensorCard key={sensor.id} sensor={sensor} />
          ))}
        </Box>

        {/* History Charts */}
        {sensors.map((sensor) => {
          const room = getRoomByDeviceId(sensor.id);
          return (
            <ClimateHistory
              key={`history-${sensor.id}`}
              deviceId={sensor.id}
              roomName={room?.name || sensor.name || `Sensor ${sensor.id.slice(-4).toUpperCase()}`}
            />
          );
        })}

        {/* Info */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Batteriebetriebene Sensoren melden Werte bei Änderungen oder alle 2 Stunden.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
