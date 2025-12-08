/**
 * Climate Page
 * Displays temperature and humidity overview for all Shelly H&T Gen3 sensors
 * Click on a card to see detailed information and history
 */

import { Box, Typography, Paper, Alert } from '@mui/material';
import Link from 'next/link';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { fetchShellySensors, getShellyDeviceIds, ShellySensorData, saveAllReadings } from '@/lib/shelly';
import { getRoomByDeviceId } from '@/lib/shelly-config';
import { FloorplanImage } from '@/components/climate/floorplan-image';
import { FloorplanMarker } from '@/components/climate/floorplan-marker';
import { ClimateOverviewChart } from '@/components/climate/climate-overview-chart';

export const revalidate = 300; // Revalidate every 5 minutes

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
  const room = getRoomByDeviceId(sensor.id);
  const displayName = room?.name || sensor.name || `Sensor ${sensor.id.slice(-4).toUpperCase()}`;
  const roomSlug = room?.slug || sensor.id;

  return (
    <Link href={`/climate/${roomSlug}`} style={{ textDecoration: 'none' }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
      >
        {/* Room Name */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          {displayName}
        </Typography>

        {/* Temperature Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ThermostatIcon sx={{ fontSize: 48, color: 'error.main' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: '2.5rem' }}>
              {sensor.temperature.toFixed(1)}
              <Typography component="span" sx={{ fontSize: '1.5rem', ml: 0.5 }}>
                °C
              </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Temperatur
            </Typography>
          </Box>
        </Box>

        {/* Humidity Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WaterDropIcon sx={{ fontSize: 48, color: 'info.main' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: '2.5rem' }}>
              {sensor.humidity.toFixed(0)}
              <Typography component="span" sx={{ fontSize: '1.5rem', ml: 0.5 }}>
                %
              </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Luftfeuchtigkeit
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Link>
  );
}

export default async function ClimatePage() {
  const data = await getClimateData();

  if ('error' in data) {
    return (
      <Box>
        <Alert severity="error">{data.error}</Alert>
      </Box>
    );
  }

  const { sensors } = data;

  return (
    <Box>
      {/* Floorplan with markers */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1000,
          mx: 'auto',
          mb: 4,
        }}
      >
        <FloorplanImage />

        {/* Markers for each room */}
        {sensors.map((sensor) => {
          const room = getRoomByDeviceId(sensor.id);
          if (!room?.floorplanPosition) return null;

          return (
            <FloorplanMarker
              key={sensor.id}
              x={room.floorplanPosition.x}
              y={room.floorplanPosition.y}
              temperature={sensor.temperature}
              humidity={sensor.humidity}
              roomSlug={room.slug}
              horizontal={room.floorplanHorizontal}
            />
          );
        })}
      </Box>

      {/* Sensor Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: `repeat(${Math.min(sensors.length, 3)}, 1fr)`,
          },
          gap: 3,
          mb: 4,
        }}
      >
        {sensors.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </Box>

      {/* Overview Charts */}
      <ClimateOverviewChart />
    </Box>
  );
}
