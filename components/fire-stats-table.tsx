/**
 * Fire Statistics Table Component
 * Displays recent fire events in a table
 */

import { FireEvent } from '@/types/dashboard';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface FireStatsTableProps {
  events: FireEvent[];
  limit?: number;
}

export function FireStatsTable({ events, limit = 10 }: FireStatsTableProps) {
  const displayEvents = events.slice(0, limit);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        🕒 Letzte Feuer-Events
      </h3>

      {displayEvents.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
          Noch keine Feuer-Events aufgezeichnet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Zeitpunkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Temperatur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Typ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {displayEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {format(new Date(event.timestamp), 'dd.MM.yyyy - HH:mm', {
                      locale: de,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {event.temperature.toFixed(1)} °C
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {event.event_type === 'fire_started' ? 'Gestartet' : event.event_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
