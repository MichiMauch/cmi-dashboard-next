/**
 * Monthly Data Display Component
 * Shows monthly production and consumption in a table
 */

import React from 'react';
import { MonthStats } from '@/lib/victron-history';

interface MonthlyDataDisplayProps {
  data: MonthStats[];
}

/**
 * Format timestamp as short date (MM.YY)
 */
function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const month = date.toLocaleDateString('de-DE', { month: '2-digit' });
  const year = date.toLocaleDateString('de-DE', { year: '2-digit' });
  return `${month}.${year}`;
}

/**
 * Format timestamp as full date (e.g., "Mai 2024")
 */
function formatFullDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
  });
}

export function MonthlyDataDisplay({ data }: MonthlyDataDisplayProps) {
  // Sort by timestamp descending (newest first)
  const sortedData = [...data].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="relative flex flex-col bg-white dark:bg-slate-800 shadow-md rounded-xl h-full">
      {/* Header */}
      <div className="flex items-center justify-end p-2 font-sans text-base font-normal text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
        <div className="flex-1 text-center">Datum</div>
        <div className="flex-1 text-right">Produktion</div>
        <div className="flex-1 text-right">Verbrauch</div>
      </div>

      {/* Data rows */}
      <nav className="flex min-w-[240px] flex-col gap-1 p-2 font-sans text-base font-normal text-slate-700 dark:text-slate-300 overflow-auto max-h-96">
        {sortedData.map((month) => {
          const fullDate = formatFullDate(month.timestamp);
          const shortDate = formatShortDate(month.timestamp);

          return (
            <div
              key={month.timestamp}
              className="flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {/* Date - show full on small screens, short on large screens */}
              <div className="flex-1 mt-1 text-center lg:hidden">{fullDate}</div>
              <div className="flex-1 mt-1 text-center hidden lg:block">{shortDate}</div>

              {/* Production */}
              <div className="flex-1 text-center">
                <div className="relative grid items-center px-2 py-1 font-sans font-bold text-slate-900 dark:text-slate-100 select-none whitespace-nowrap text-right">
                  <span>{month.total_solar_yield.toFixed(2)} kWh</span>
                </div>
              </div>

              {/* Consumption */}
              <div className="flex-1 text-center">
                <div className="relative grid items-center px-2 py-1 font-sans font-bold text-slate-900 dark:text-slate-100 select-none whitespace-nowrap text-right">
                  <span>{month.total_consumption.toFixed(2)} kWh</span>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
