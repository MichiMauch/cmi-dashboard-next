/**
 * Grid Power Display Component
 * Shows power flow from/to the grid
 */

import React from 'react';

interface GridPowerDisplayProps {
  gridPower: number; // Grid power in Watts (negative = feeding to grid, positive = drawing from grid)
}

export function GridPowerDisplay({ gridPower }: GridPowerDisplayProps) {
  const isFeeding = gridPower < 0;
  const absolutePower = Math.abs(gridPower);

  return (
    <div className="flex flex-col px-4 py-4 overflow-hidden bg-white dark:bg-slate-800 hover:bg-gradient-to-br hover:from-purple-400 hover:via-blue-400 hover:to-blue-500 rounded-xl shadow-lg duration-300 hover:shadow-2xl group">
      <div className="flex flex-row justify-between items-center">
        <div className="px-4 py-4 bg-slate-200 dark:bg-slate-700 rounded-xl bg-opacity-30">
          <span className={`text-3xl ${isFeeding ? 'text-green-500' : 'text-orange-500'}`}>
            {isFeeding ? '↑' : '↓'}
          </span>
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-slate-700 dark:text-slate-100 mt-6 group-hover:text-white">
        {absolutePower.toFixed(0)} W
      </h1>
      <div className="flex flex-row justify-between text-slate-700 dark:text-slate-300 group-hover:text-slate-100">
        <p>{isFeeding ? 'Einspeisung ins Netz' : 'Bezug aus Netz'}</p>
      </div>
    </div>
  );
}
