/**
 * Dashboard Data Types
 * Matches the structure exported from Raspberry Pi's SQLite database
 */

export interface FireEvent {
  id: number;
  timestamp: string; // ISO datetime string
  temperature: number;
  event_type: string;
  notes?: string;
}

export interface TemperatureReading {
  id: number;
  timestamp: string; // ISO datetime string
  temperature: number;
}

export interface OvenState {
  state: 'cold' | 'warming' | 'hot' | 'cooling';
  last_updated: string; // ISO datetime string
  temp_history?: number[];
  last_logged_date?: string;
}

export interface CurrentTemperature {
  nummer: number;
  ort: string;
  wert: number;
  einheit: string;
}

export interface MonthlyStats {
  month: string; // 'YYYY-MM' format
  year: string;
  count: number;
  avg_temp: number;
  max_temp: number;
}

export interface DashboardData {
  current_temps: CurrentTemperature[];
  oven_state: OvenState;
  fire_events: FireEvent[];
  temperature_history: TemperatureReading[];
  monthly_stats: MonthlyStats[];
  last_updated: string; // ISO datetime string
}
