/**
 * Monthly Statistics Component
 * Displays fire event statistics by month using Recharts
 */

'use client';

import { MonthlyStats } from '@/types/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyStatsCardProps {
  stats: MonthlyStats[];
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januar',
  '02': 'Februar',
  '03': 'März',
  '04': 'April',
  '05': 'Mai',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'August',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Dezember',
};

export function MonthlyStatsCard({ stats }: MonthlyStatsCardProps) {
  // Prepare data for bar chart
  const chartData = stats.map((stat) => {
    const [year, month] = stat.month.split('-');
    return {
      name: `${MONTH_NAMES[month]} ${year}`,
      'Feuer Events': stat.count,
    };
  }).reverse(); // Reverse to show oldest to newest

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          📊 Feuer-Events pro Monat
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="name"
                className="text-xs text-slate-600 dark:text-slate-400"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs text-slate-600 dark:text-slate-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(30 41 59)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
              />
              <Bar dataKey="Feuer Events" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            Noch keine Statistiken verfügbar
          </p>
        )}
      </div>

      {/* Table with details */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          📅 Monatliche Übersicht
        </h3>
        {stats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Monat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Anzahl
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ø Temp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Max Temp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {stats.map((stat) => {
                  const [year, month] = stat.month.split('-');
                  return (
                    <tr key={stat.month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {MONTH_NAMES[month]} {stat.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {stat.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {stat.avg_temp.toFixed(1)} °C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {stat.max_temp.toFixed(1)} °C
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            Noch keine Statistiken verfügbar
          </p>
        )}
      </div>
    </div>
  );
}
