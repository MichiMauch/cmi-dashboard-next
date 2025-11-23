/**
 * Monthly Yield Chart Component
 * Shows solar yield for last 24 months as bar chart
 */

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MonthStats } from '@/lib/victron-history';

interface MonthlyYieldChartProps {
  data: MonthStats[];
}

export function MonthlyYieldChart({ data }: MonthlyYieldChartProps) {
  // Format data for chart
  const chartData = data.map((month) => ({
    month: new Date(month.timestamp * 1000).toLocaleDateString('de-DE', {
      month: 'short',
      year: '2-digit',
    }),
    yield: parseFloat(month.total_solar_yield.toFixed(2)),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Monatlicher Ertrag (24 Monate)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-300 dark:stroke-slate-700" />
          <XAxis
            dataKey="month"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [`${value} kWh`, 'Ertrag']}
          />
          <Bar dataKey="yield" fill="#f59e0b" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
