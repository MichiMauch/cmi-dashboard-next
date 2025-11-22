/**
 * KOKOMO Heating Dashboard - Main Page
 * Displays real-time heating system data from CMI via Raspberry Pi
 */

import { getDashboardData } from '@/lib/data';
import { TempGaugeCard } from '@/components/temp-gauge-card';
import { OvenStatusBadge } from '@/components/oven-status-badge';
import { FireStatsTable } from '@/components/fire-stats-table';
import { MonthlyStatsCard } from '@/components/monthly-stats-card';
import { Card, Grid, Title, Text, Metric } from '@tremor/react';
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
          <Text>Live-Daten aus der CMI JSON API</Text>
          <Text className="text-sm text-slate-500">
            Letztes Update: {format(new Date(data.last_updated), 'dd.MM.yyyy - HH:mm', { locale: de })}
          </Text>
        </div>

        {/* Status and Overview */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <OvenStatusBadge state={data.oven_state} />
        </div>

        {/* Key Metrics */}
        <Grid numItemsSm={2} numItemsLg={3} className="gap-4">
          <Card>
            <Text>Gesamt Feuer-Events</Text>
            <Metric>{totalEvents}</Metric>
          </Card>
          <Card>
            <Text>Dieser Monat</Text>
            <Metric>{currentMonthStats?.count ?? 0}</Metric>
          </Card>
          <Card>
            <Text>Ø pro Monat</Text>
            <Metric>
              {data.monthly_stats.length > 0
                ? (
                    data.monthly_stats.reduce((sum, stat) => sum + stat.count, 0) /
                    data.monthly_stats.length
                  ).toFixed(1)
                : '0'}
            </Metric>
          </Card>
        </Grid>

        {/* Temperature Gauges */}
        <div>
          <Title className="mb-4">🌡️ Temperaturen</Title>
          <Grid numItemsSm={2} numItemsLg={3} className="gap-4">
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
          </Grid>
        </div>

        {/* Fire Statistics */}
        <div>
          <Title className="mb-4">🔥 Feuer-Statistik</Title>
          <div className="space-y-6">
            <FireStatsTable events={data.fire_events} limit={10} />
            <MonthlyStatsCard stats={data.monthly_stats} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-8">
          <Text>
            Daten werden stündlich vom Raspberry Pi aktualisiert
          </Text>
        </div>
      </div>
    </div>
  );
}
