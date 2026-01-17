/**
 * Victron Energy VRM API Types
 * Based on Victron VRM API v2 responses
 */

// Grid connection status
export type GridStatus = 'autark' | 'grid_consuming' | 'grid_feeding' | 'unknown';

// Live feed data point: [timestamp, value, unit, formattedValue]
export type DataPoint = [number, number, number, number];

// Battery status data point
export type BatteryDataPoint = [number, number, number, number];

// Stats response from Victron API
export interface VictronStatsResponse {
  success: boolean;
  records: {
    // Power DC (Solar panels)
    Pdc?: DataPoint[];

    // Battery status
    bs?: BatteryDataPoint[];

    // Total solar yield (kWh)
    total_solar_yield?: DataPoint[];

    // Total consumption (kWh)
    total_consumption?: DataPoint[];

    // Grid power (positive = consuming, negative = feeding)
    Pg?: DataPoint[];

    // AC Load
    Pac?: DataPoint[];

    // Battery power
    Pb?: DataPoint[];

    // Battery voltage
    Vb?: DataPoint[];

    // Battery current
    Ib?: DataPoint[];

    // Average power
    average_power?: DataPoint[];

    // Total energy imported from grid
    total_energy_imported?: DataPoint[];

    // Total energy exported to grid
    total_energy_exported?: DataPoint[];

    // Grid history from
    grid_history_from?: DataPoint[];
  };
  totals?: {
    Pdc?: number;
    total_solar_yield?: number;
    total_consumption?: number;
  };
}

// Token response from Victron login
export interface VictronTokenResponse {
  token: string;
  idUser: number;
}

// Login request
export interface VictronLoginRequest {
  username: string;
  password: string;
}

// Installation info
export interface VictronInstallation {
  idSite: number;
  name: string;
}

// Processed solar data for components
export interface SolarData {
  currentPower: number; // Current solar power (W)
  batteryCharge: number; // Battery charge percentage
  batteryPower: number; // Battery power (W, positive = charging)
  gridPower: number; // Grid power (W, positive = consuming)
  gridStatus: GridStatus; // Detailed grid connection status
  consumption: number; // Current consumption (W)
  todayYield: number; // Today's solar yield (kWh)
  todayConsumption: number; // Today's consumption (kWh)
  timestamp: number; // Last update timestamp
}

// Monthly/Historical stats
export interface HistoricalStats {
  date: string; // ISO date string
  yield: number; // Solar yield (kWh)
  consumption: number; // Consumption (kWh)
  gridFeedIn: number; // Fed to grid (kWh)
  gridConsumption: number; // Consumed from grid (kWh)
  autarky: number; // Self-sufficiency percentage
}
