/**
 * Solar Dashboard Page
 * Displays solar panel, battery, and consumption data from Victron Energy
 */

import { BatteryDisplay } from '@/components/solar/battery-display';
import { PowerDisplay } from '@/components/solar/power-display';
import { ConsumptionDisplay } from '@/components/solar/consumption-display';
import { PeakPowerDisplay } from '@/components/solar/peak-power-display';
import { SolarYieldDisplay } from '@/components/solar/solar-yield-display';
import { AutarkieDisplay } from '@/components/solar/autarkie-display';
import { YearSolarYieldDisplay } from '@/components/solar/year-solar-yield-display';
import { YearConsumptionDisplay } from '@/components/solar/year-consumption-display';
import { YearGridImportDisplay } from '@/components/solar/year-grid-import-display';
import { MonthlyYieldChart } from '@/components/solar/monthly-yield-chart';
import { MonthlyDataDisplay } from '@/components/solar/monthly-data-display';
import { PeakPowerChart } from '@/components/solar/peak-power-chart';
import { GridImportChart } from '@/components/solar/grid-import-chart';
import { fetchVictronStats, processSolarData } from '@/lib/victron';
import { fetchWithTokenRefresh } from '@/lib/victron-token';
import {
  fetchLast7Days,
  fetchLast24Months,
  fetchAutarkieStats,
  fetchLast30DaysPeakPower,
} from '@/lib/victron-history';

export const revalidate = 300; // Revalidate every 5 minutes

async function getSolarData() {
  try {
    const installationId = process.env.VICTRON_INSTALLATION_ID;

    if (!installationId) {
      throw new Error('VICTRON_INSTALLATION_ID not configured');
    }

    console.log('[SolarPage] Fetching Victron data...');

    // Fetch data directly (no HTTP call needed)
    const stats = await fetchWithTokenRefresh((token) =>
      fetchVictronStats(installationId, token, '15mins', 'live_feed')
    );

    // Process data for easier consumption
    const processedData = processSolarData(stats);

    console.log('[SolarPage] Data fetched successfully');

    return {
      raw: stats,
      processed: processedData,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[SolarPage] Error fetching solar data:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default async function SolarPage() {
  // Fetch all data in parallel
  const [solarData, last7Days, last24Months, autarkieStats, peakPowerHistory] = await Promise.all([
    getSolarData(),
    fetchLast7Days().catch((err) => {
      console.error('[SolarPage] Error fetching last 7 days:', err);
      return [];
    }),
    fetchLast24Months().catch((err) => {
      console.error('[SolarPage] Error fetching last 24 months:', err);
      return [];
    }),
    fetchAutarkieStats().catch((err) => {
      console.error('[SolarPage] Error fetching autarkie stats:', err);
      return null;
    }),
    fetchLast30DaysPeakPower().catch((err) => {
      console.error('[SolarPage] Error fetching peak power history:', err);
      return [];
    }),
  ]);

  if (!solarData || 'error' in solarData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            ⚠️ Solar-Daten nicht verfügbar
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Die Victron API kann derzeit nicht erreicht werden.
          </p>
          {'error' in solarData && (
            <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-slate-100 dark:bg-slate-800 p-4 rounded">
              {solarData.error}
            </p>
          )}
          <div className="mt-6 text-left text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-4 rounded">
            <p className="font-semibold mb-2">Bitte prüfen Sie auf Vercel:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>MONGODB_URI ist korrekt gesetzt</li>
              <li>VICTRON_USERNAME ist gesetzt</li>
              <li>VICTRON_PASSWORD ist gesetzt</li>
              <li>VICTRON_INSTALLATION_ID ist gesetzt</li>
            </ul>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PowerDisplay power={processed.currentPower} />
          <ConsumptionDisplay
            todayConsumption={processed.todayConsumption}
          />
          <PeakPowerDisplay />
        </div>

        {/* Battery Status and Autarkie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80">
            <BatteryDisplay charge={processed.batteryCharge} />
          </div>
          {autarkieStats && (
            <div className="h-80">
              <AutarkieDisplay data={autarkieStats} />
            </div>
          )}
        </div>

        {/* Year Statistics Cards */}
        {autarkieStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <YearSolarYieldDisplay totalYield={autarkieStats.total_solar_yield} />
            <YearConsumptionDisplay totalConsumption={autarkieStats.total_consumption} />
            <YearGridImportDisplay gridImport={autarkieStats.grid_history_from} />
          </div>
        )}

        {/* Historical Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Last 7 Days */}
          {last7Days.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Letzte 7 Tage
              </h3>
              <SolarYieldDisplay data={last7Days} />
            </div>
          )}

          {/* Monthly Data Table */}
          {last24Months.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Monatliche Daten
              </h3>
              <MonthlyDataDisplay data={last24Months} />
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Yield Chart */}
          {last24Months.length > 0 && (
            <MonthlyYieldChart data={last24Months} />
          )}

          {/* Peak Power Chart */}
          {peakPowerHistory.length > 0 && (
            <PeakPowerChart data={peakPowerHistory} />
          )}
        </div>

        {/* Grid Import Chart */}
        {last24Months.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            <GridImportChart data={last24Months} />
          </div>
        )}
      </div>
    </div>
  );
}
