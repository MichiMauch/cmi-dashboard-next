/**
 * Peak Power Chart Component
 * Shows peak power for last 30 days as line chart
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PeakPowerHistoryStats } from '@/lib/victron-history';

interface PeakPowerChartProps {
  data: PeakPowerHistoryStats[];
}

export function PeakPowerChart({ data }: PeakPowerChartProps) {
  // Format data for chart
  const chartData = data.map((entry) => ({
    date: new Date(entry.timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    }),
    power: parseFloat(entry.peak_power.toFixed(2)),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Spitzenleistungen der letzten 30 Tage
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            label={{
              value: 'Spitzenleistung (W)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'currentColor' }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [`${value} W`, 'Peak Power']}
          />
          <Line
            type="monotone"
            dataKey="power"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: '#06b6d4', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
