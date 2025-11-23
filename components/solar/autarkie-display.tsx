/**
 * Autarkie Display Component
 * Shows self-sufficiency percentage for current year
 */

import React from 'react';
import { AutarkieStats } from '@/lib/victron-history';

interface AutarkieDisplayProps {
  data: AutarkieStats;
}

export function AutarkieDisplay({ data }: AutarkieDisplayProps) {
  const { autarkie, total_solar_yield, total_consumption, grid_history_from } = data;

  // Calculate percentage for progress bar
  const percentage = Math.min(100, Math.max(0, autarkie));

  // Color based on autarkie percentage
  const getColor = () => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col px-6 py-6 overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <div className="flex flex-row justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Autarkie {new Date().getFullYear()}
        </h3>
        <span className="text-3xl">🔋</span>
      </div>

      {/* Percentage Circle or Bar */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="text-slate-200 dark:text-slate-700 stroke-current"
              strokeWidth="10"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            {/* Progress circle */}
            <circle
              className={`${getColor()} stroke-current`}
              strokeWidth="10"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
              transform="rotate(-90 50 50)"
            ></circle>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {autarkie.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Solarertrag:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {total_solar_yield.toFixed(0)} kWh
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Gesamtverbrauch:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {total_consumption.toFixed(0)} kWh
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Netzbezug:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {grid_history_from.toFixed(0)} kWh
          </span>
        </div>
      </div>
    </div>
  );
}
