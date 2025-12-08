/**
 * Room Climate Detail Page (Dynamic Route)
 * Displays temperature and humidity data for a specific room's sensor
 */

import { Box, Typography, Paper, Alert, Chip } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KitchenIcon from '@mui/icons-material/Kitchen';
import BathtubIcon from '@mui/icons-material/Bathtub';
import ComputerIcon from '@mui/icons-material/Computer';
import HotelIcon from '@mui/icons-material/Hotel';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { notFound } from 'next/navigation';
import { fetchShellySensors, ShellySensorData } from '@/lib/shelly';
import { getRoomBySlug, isRoomConfigured, SHELLY_ROOMS, ShellyRoom } from '@/lib/shelly-config';
import { ClimateHistory } from '@/components/climate/climate-history';

export const revalidate = 300;

// Format datetime from Shelly format to local display
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const utcDate = new Date(dateStr.replace(' ', 'T') + 'Z');
  return utcDate.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate static paths for all rooms
export function generateStaticParams() {
  return SHELLY_ROOMS.map((room) => ({
    room: room.slug,
  }));
}

// Icon component based on room config
function RoomIcon({ icon, sx }: { icon: ShellyRoom['icon']; sx?: object }) {
  const iconProps = { sx: { fontSize: 48, color: 'primary.main', ...sx } };
  switch (icon) {
    case 'Kitchen':
      return <KitchenIcon {...iconProps} />;
    case 'Bathtub':
      return <BathtubIcon {...iconProps} />;
    case 'Computer':
      return <ComputerIcon {...iconProps} />;
    case 'Hotel':
      return <HotelIcon {...iconProps} />;
    case 'WbSunny':
      return <WbSunnyIcon {...iconProps} />;
    default:
      return <ThermostatIcon {...iconProps} />;
  }
}

async function getRoomData(
  deviceId: string
): Promise<{ sensor: ShellySensorData } | { error: string }> {
  try {
    const sensors = await fetchShellySensors([deviceId]);
    if (sensors.length === 0) {
      return { error: 'Keine Daten vom Sensor' };
    }
    return { sensor: sensors[0] };
  } catch (error) {
    console.error('[Room Page] Error fetching sensor data:', error);
    return { error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }
}

interface RoomPageProps {
  params: Promise<{ room: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { room: roomSlug } = await params;
  const room = getRoomBySlug(roomSlug);

  // Room not found in config
  if (!room) {
    notFound();
  }

  // Room exists but sensor not configured
  if (!isRoomConfigured(roomSlug)) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <RoomIcon icon={room.icon} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {room.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Temperatur und Luftfeuchtigkeit
            </Typography>
          </Box>
        </Box>
        <Alert severity="info">
          Sensor noch nicht konfiguriert. Bitte Device-ID in lib/shelly-config.ts eintragen.
        </Alert>
      </Box>
    );
  }

  const data = await getRoomData(room.deviceId);

  if ('error' in data) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <RoomIcon icon={room.icon} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {room.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Temperatur und Luftfeuchtigkeit
            </Typography>
          </Box>
        </Box>
        <Alert severity="error">{data.error}</Alert>
      </Box>
    );
  }

  const { sensor } = data;

  return (
    <Box>
        {/* Header with Room Name and Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <RoomIcon icon={room.icon} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {room.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Temperatur und Luftfeuchtigkeit
            </Typography>
          </Box>
          <Chip
            label={sensor.online ? 'Online' : 'Offline'}
            color={sensor.online ? 'success' : 'error'}
            size="medium"
          />
        </Box>

        {/* Current Values */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Temperature Card */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background:
                'linear-gradient(135deg, rgba(239, 83, 80, 0.1) 0%, rgba(239, 83, 80, 0.05) 100%)',
            }}
          >
            <ThermostatIcon sx={{ fontSize: 64, color: 'error.main' }} />
            <Box>
              <Typography variant="h2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {sensor.temperature.toFixed(1)}
                <Typography component="span" variant="h4" sx={{ ml: 0.5 }}>
                  °C
                </Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Aktuelle Temperatur
              </Typography>
            </Box>
          </Paper>

          {/* Humidity Card */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background:
                'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(66, 165, 245, 0.05) 100%)',
            }}
          >
            <WaterDropIcon sx={{ fontSize: 64, color: 'info.main' }} />
            <Box>
              <Typography variant="h2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {sensor.humidity.toFixed(1)}
                <Typography component="span" variant="h4" sx={{ ml: 0.5 }}>
                  %
                </Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Aktuelle Luftfeuchtigkeit
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Sensor Details */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Sensor Details
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {/* Battery */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {sensor.battery > 20 ? (
                <BatteryFullIcon sx={{ fontSize: 32, color: 'success.main' }} />
              ) : (
                <BatteryAlertIcon sx={{ fontSize: 32, color: 'warning.main' }} />
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1 }}>
                  {sensor.battery}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Batterie
                </Typography>
              </Box>
            </Box>

            {/* WiFi Signal */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SignalWifi4BarIcon
                sx={{
                  fontSize: 32,
                  color: sensor.wifiSignal > -70 ? 'success.main' : sensor.wifiSignal > -80 ? 'warning.main' : 'error.main',
                }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1 }}>
                  {sensor.wifiSignal} dBm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  WiFi Signal
                </Typography>
              </Box>
            </Box>

            {/* Last Update */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccessTimeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1 }}>
                  {formatDateTime(sensor.lastUpdate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Letzte Aktualisierung
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* History Chart */}
        <ClimateHistory deviceId={room.deviceId} roomName={room.name} />
    </Box>
  );
}
