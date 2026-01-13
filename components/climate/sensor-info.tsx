'use client';

/**
 * Sensor Info Component
 * Displays battery and WiFi signal information for Shelly sensors
 */

import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import Battery20Icon from '@mui/icons-material/Battery20';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import SignalWifi3BarIcon from '@mui/icons-material/SignalWifi3Bar';
import SignalWifi2BarIcon from '@mui/icons-material/SignalWifi2Bar';
import SignalWifi1BarIcon from '@mui/icons-material/SignalWifi1Bar';

interface SensorInfoProps {
  lastUpdate: string;
  battery: number;
  wifiSignal: number;
}

// Format datetime to local display
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Battery icon based on percentage
function BatteryIcon({ percent }: { percent: number }) {
  const sx = { fontSize: 20, color: percent < 20 ? 'error.main' : 'text.secondary' };
  if (percent >= 60) return <BatteryFullIcon sx={sx} />;
  if (percent >= 20) return <Battery60Icon sx={sx} />;
  return <Battery20Icon sx={sx} />;
}

// WiFi icon based on RSSI (signal strength)
function WifiIcon({ rssi }: { rssi: number }) {
  const sx = { fontSize: 20, color: rssi < -80 ? 'warning.main' : 'text.secondary' };
  // RSSI: -30 = excellent, -67 = good, -70 = fair, -80 = weak
  if (rssi >= -50) return <SignalWifi4BarIcon sx={sx} />;
  if (rssi >= -60) return <SignalWifi3BarIcon sx={sx} />;
  if (rssi >= -70) return <SignalWifi2BarIcon sx={sx} />;
  return <SignalWifi1BarIcon sx={sx} />;
}

export function SensorInfo({ lastUpdate, battery, wifiSignal }: SensorInfoProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          Letzte Aktualisierung: {formatDateTime(lastUpdate)}
        </Typography>
      </Box>

      {battery > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BatteryIcon percent={battery} />
          <Typography variant="body2" color="text.secondary">
            Batterie: {battery}%
          </Typography>
        </Box>
      )}

      {wifiSignal !== 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WifiIcon rssi={wifiSignal} />
          <Typography variant="body2" color="text.secondary">
            WiFi: {wifiSignal} dBm
          </Typography>
        </Box>
      )}
    </Box>
  );
}
