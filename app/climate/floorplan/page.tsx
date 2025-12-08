/**
 * Floorplan Page
 * Displays house floorplan with temperature/humidity markers for each room
 */

import { Box, Alert } from '@mui/material';
import { fetchShellySensors, getShellyDeviceIds } from '@/lib/shelly';
import { getRoomByDeviceId } from '@/lib/shelly-config';
import { FloorplanMarker } from '@/components/climate/floorplan-marker';
import { FloorplanImage } from '@/components/climate/floorplan-image';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function FloorplanPage() {
  const deviceIds = getShellyDeviceIds();

  if (deviceIds.length === 0) {
    return (
      <Box>
        <Alert severity="error">Keine Shelly Sensoren konfiguriert</Alert>
      </Box>
    );
  }

  let sensors;
  try {
    sensors = await fetchShellySensors(deviceIds);
  } catch (error) {
    return (
      <Box>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Fehler beim Laden der Sensordaten'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1000,
          mx: 'auto',
        }}
      >
        {/* Floorplan Image */}
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
    </Box>
  );
}
