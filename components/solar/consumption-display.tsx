/**
 * Consumption Display Component
 * Shows current consumption and today's total consumption
 */

import React from 'react';

interface ConsumptionDisplayProps {
  currentConsumption: number; // Current consumption in Watts
  todayConsumption: number; // Today's total consumption in kWh
}

export function ConsumptionDisplay({
  currentConsumption,
  todayConsumption,
}: ConsumptionDisplayProps) {
  return (
    <div className="flex flex-col px-4 py-4 overflow-hidden bg-white dark:bg-slate-800 hover:bg-gradient-to-br hover:from-purple-400 hover:via-blue-400 hover:to-blue-500 rounded-xl shadow-lg duration-300 hover:shadow-2xl group">
      <div className="flex flex-row justify-between items-center">
        <div className="px-4 py-4 bg-slate-200 dark:bg-slate-700 rounded-xl bg-opacity-30">
          <span className="text-red-500 text-3xl">⚡</span>
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-slate-700 dark:text-slate-100 mt-6 group-hover:text-white">
        {currentConsumption.toFixed(0)} W
      </h1>
      <div className="flex flex-col text-slate-700 dark:text-slate-300 group-hover:text-slate-100">
        <p className="font-medium">Aktueller Verbrauch</p>
        <p className="text-sm mt-1">
          Heute: {todayConsumption.toFixed(2)} kWh
        </p>
      </div>
    </div>
  );
}
