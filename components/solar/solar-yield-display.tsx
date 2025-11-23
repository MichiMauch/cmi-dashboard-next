/**
 * Solar Yield Display Component
 * Shows daily solar yield and consumption for the last 7 days
 */

import React from 'react';
import { DayStats } from '@/lib/victron-history';

interface SolarYieldDisplayProps {
  data: DayStats[];
}

export function SolarYieldDisplay({ data }: SolarYieldDisplayProps) {
  const formatDate = (timestamp: number): { weekday: string; day: string; month: string } => {
    const date = new Date(timestamp);
    const weekday = date.toLocaleDateString('de-DE', { weekday: 'short' });
    const day = date.toLocaleDateString('de-DE', { day: 'numeric' });
    const month = date.toLocaleDateString('de-DE', { month: 'long' });

    return { weekday, day, month };
  };

  const formatShortDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const day = date.toLocaleDateString('de-DE', { day: '2-digit' });
    const month = date.toLocaleDateString('de-DE', { month: '2-digit' });

    return `${day}.${month}.`;
  };

  // Filter out today and sort by newest first
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const filteredData = data
    .filter((day) => day.timestamp < today.getTime())
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="relative flex flex-col text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 shadow-md rounded-xl h-full">
      <div className="flex items-center justify-end p-2 font-sans text-base font-normal border-b border-slate-300 dark:border-slate-700">
        <div className="flex-1 text-center">Datum</div>
        <div className="flex-1 text-right">Produktion</div>
        <div className="flex-1 text-right">Verbrauch</div>
      </div>
      <nav className="flex flex-col gap-1 p-2 font-sans text-base font-normal overflow-auto max-h-96">
        {filteredData.map((day) => {
          const { weekday, day: dayOfMonth, month } = formatDate(day.timestamp);
          const shortDate = formatShortDate(day.timestamp);
          return (
            <div
              key={day.timestamp}
              className="flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <div className="flex-1 mt-1 text-center lg:hidden">
                {weekday}, {dayOfMonth}. {month}
              </div>
              <div className="flex-1 mt-1 text-center lg:block hidden">{shortDate}</div>
              <div className="flex-1 text-center">
                <div className="relative grid items-center px-2 py-1 font-sans font-bold text-slate-900 dark:text-slate-100 select-none whitespace-nowrap text-right">
                  <span>{day.total_solar_yield.toFixed(2)} kWh</span>
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="relative grid items-center px-2 py-1 font-sans font-bold text-slate-900 dark:text-slate-100 select-none whitespace-nowrap text-right">
                  <span>{day.total_consumption.toFixed(2)} kWh</span>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
