/**
 * Grid Import Chart Component
 * Shows grid import for last 24 months as line chart
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
import { MonthStats } from '@/lib/victron-history';

interface GridImportChartProps {
  data: MonthStats[];
}

export function GridImportChart({ data }: GridImportChartProps) {
  // Format data for chart
  const chartData = data.map((month) => ({
    month: new Date(month.timestamp * 1000).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
    }),
    gridImport: parseFloat(month.grid_history_from.toFixed(2)),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Strombezug von extern der letzten 24 Monate
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
          <XAxis
            dataKey="month"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            label={{
              value: 'Strombezug (kWh)',
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
            formatter={(value: number) => [`${value} kWh`, 'Strombezug von extern']}
          />
          <Line
            type="monotone"
            dataKey="gridImport"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
