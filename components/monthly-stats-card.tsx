/**
 * Monthly Statistics Component
 * Displays fire event statistics by month
 */

import {
  Card,
  BarChart,
  Title,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@tremor/react';
import { MonthlyStats } from '@/types/dashboard';

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
      <Card>
        <Title>📊 Feuer-Events pro Monat</Title>
        {chartData.length > 0 ? (
          <BarChart
            className="mt-6"
            data={chartData}
            index="name"
            categories={['Feuer Events']}
            colors={['orange']}
            valueFormatter={(value) => `${value}`}
            yAxisWidth={48}
          />
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            Noch keine Statistiken verfügbar
          </p>
        )}
      </Card>

      {/* Table with details */}
      <Card>
        <Title>📅 Monatliche Übersicht</Title>
        {stats.length > 0 ? (
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Monat</TableHeaderCell>
                <TableHeaderCell>Anzahl</TableHeaderCell>
                <TableHeaderCell>Ø Temp</TableHeaderCell>
                <TableHeaderCell>Max Temp</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((stat) => {
                const [year, month] = stat.month.split('-');
                return (
                  <TableRow key={stat.month}>
                    <TableCell>
                      {MONTH_NAMES[month]} {stat.year}
                    </TableCell>
                    <TableCell>{stat.count}</TableCell>
                    <TableCell>{stat.avg_temp.toFixed(1)} °C</TableCell>
                    <TableCell>{stat.max_temp.toFixed(1)} °C</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            Noch keine Statistiken verfügbar
          </p>
        )}
      </Card>
    </div>
  );
}
