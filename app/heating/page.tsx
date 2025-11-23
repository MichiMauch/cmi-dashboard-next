/**
 * KOKOMO Heating Dashboard - Main Page
 * Displays real-time heating system data from CMI via Raspberry Pi
 */

import { getDashboardData } from '@/lib/data';
import { TempGaugeCard } from '@/components/temp-gauge-card';
import { OvenStatusBadge } from '@/components/oven-status-badge';
import { FireStatsTable } from '@/components/fire-stats-table';
import { MonthlyStatsCard } from '@/components/monthly-stats-card';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export const revalidate = 3600; // Revalidate every 60 minutes

export default async function Home() {
  const data = await getDashboardData();

  // Calculate total events
  const totalEvents = data.fire_events.length;

  // Get current month stats
  const currentMonthStats = data.monthly_stats[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            🔥 KOKOMO Heating Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Live-Daten aus der CMI JSON API</p>
          <p className="text-sm text-slate-500">
            Letztes Update: {format(new Date(data.last_updated), 'dd.MM.yyyy - HH:mm', { locale: de })}
          </p>
        </div>

        {/* Status and Overview */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <OvenStatusBadge state={data.oven_state} />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Gesamt Feuer-Events</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{totalEvents}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Dieser Monat</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{currentMonthStats?.count ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Ø pro Monat</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {data.monthly_stats.length > 0
                ? (
                    data.monthly_stats.reduce((sum, stat) => sum + stat.count, 0) /
                    data.monthly_stats.length
                  ).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>

        {/* Temperature Gauges */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">🌡️ Temperaturen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.current_temps
              .filter((temp) => temp.nummer >= 1 && temp.nummer <= 6)
              .sort((a, b) => a.nummer - b.nummer)
              .map((temp) => (
                <TempGaugeCard
                  key={temp.nummer}
                  temp={temp}
                  isOven={temp.nummer === 4}
                />
              ))}
          </div>
        </div>

        {/* Fire Statistics */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">🔥 Feuer-Statistik</h2>
          <div className="space-y-6">
            <FireStatsTable events={data.fire_events} limit={10} />
            <MonthlyStatsCard stats={data.monthly_stats} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-8">
          <p>Daten werden stündlich vom Raspberry Pi aktualisiert</p>
        </div>
      </div>
    </div>
  );
}
