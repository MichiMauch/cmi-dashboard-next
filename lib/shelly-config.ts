/**
 * Shelly Sensor Configuration
 * Central configuration for all Shelly H&T sensors
 */

export interface ShellyRoom {
  deviceId: string;
  name: string;
  slug: string;
  icon: 'Kitchen' | 'Bathtub' | 'Computer' | 'Hotel' | 'WbSunny';
}

/**
 * Liste aller konfigurierten Shelly H&T Sensoren
 * Hier neue Sensoren hinzufügen
 */
export const SHELLY_ROOMS: ShellyRoom[] = [
  { deviceId: 'e4b3232f84a8', name: 'Küche', slug: 'kueche', icon: 'Kitchen' },
  { deviceId: 'e4b32332e2c8', name: 'Bad', slug: 'bad', icon: 'Bathtub' },
  { deviceId: 'e4b323304058', name: 'Büro', slug: 'buero', icon: 'Computer' },
  { deviceId: 'e4b3233182e8', name: 'Schlafzimmer', slug: 'schlafen', icon: 'Hotel' },
  { deviceId: '', name: 'Aussen', slug: 'aussen', icon: 'WbSunny' },
];

/**
 * Get room configuration by URL slug
 */
export function getRoomBySlug(slug: string): ShellyRoom | undefined {
  return SHELLY_ROOMS.find((room) => room.slug === slug);
}

/**
 * Get room configuration by device ID
 */
export function getRoomByDeviceId(deviceId: string): ShellyRoom | undefined {
  return SHELLY_ROOMS.find((room) => room.deviceId === deviceId);
}

/**
 * Get all configured device IDs (excluding empty ones)
 */
export function getAllDeviceIds(): string[] {
  return SHELLY_ROOMS.map((room) => room.deviceId).filter((id) => id !== '');
}

/**
 * Get all rooms with configured sensors
 */
export function getConfiguredRooms(): ShellyRoom[] {
  return SHELLY_ROOMS.filter((room) => room.deviceId !== '');
}

/**
 * Check if a room has a configured sensor
 */
export function isRoomConfigured(slug: string): boolean {
  const room = getRoomBySlug(slug);
  return room !== undefined && room.deviceId !== '';
}
