/**
 * Solar Dashboard Page
 * Displays solar panel, battery, and consumption data from Victron Energy
 */

import { BatteryDisplay } from '@/components/solar/battery-display';
import { PowerDisplay } from '@/components/solar/power-display';
import { ConsumptionDisplay } from '@/components/solar/consumption-display';
import { GridPowerDisplay } from '@/components/solar/grid-power-display';
import { BatteryPowerDisplay } from '@/components/solar/battery-power-display';

export const revalidate = 300; // Revalidate every 5 minutes

async function getSolarData() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/victron/stats`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch solar data');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching solar data:', error);
    return null;
  }
}

export default async function SolarPage() {
  const solarData = await getSolarData();

  if (!solarData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            ⚠️ Solar-Daten nicht verfügbar
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Bitte prüfen Sie die Victron API Konfiguration und stellen Sie sicher,
            dass Vercel KV eingerichtet ist.
          </p>
        </div>
      </div>
    );
  }

  const { processed } = solarData;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
            ☀️ Solar Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Live-Daten von Victron Energy VRM
          </p>
          <p className="text-sm text-slate-500">
            Letztes Update: {new Date(solarData.timestamp).toLocaleString('de-DE')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Aktuelle Leistung</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {processed.currentPower.toFixed(0)} <span className="text-lg">W</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Batterieladung</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {processed.batteryCharge.toFixed(1)} <span className="text-lg">%</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Heutiger Ertrag</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {processed.todayYield.toFixed(2)} <span className="text-lg">kWh</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Verbrauch Heute</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {processed.todayConsumption.toFixed(2)} <span className="text-lg">kWh</span>
            </p>
          </div>
        </div>

        {/* Power Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PowerDisplay power={processed.currentPower} />
          <ConsumptionDisplay
            currentConsumption={processed.consumption}
            todayConsumption={processed.todayConsumption}
          />
          <GridPowerDisplay gridPower={processed.gridPower} />
          <BatteryPowerDisplay batteryPower={processed.batteryPower} />
        </div>

        {/* Battery Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 h-80">
            <BatteryDisplay charge={processed.batteryCharge} />
          </div>

          {/* Placeholder for future components */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Verlaufsdaten
            </h3>
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              <p>Charts und historische Daten folgen...</p>
              <p className="text-xs mt-2">
                (Autarkie, Monatsertrag, Peak Power, etc.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
