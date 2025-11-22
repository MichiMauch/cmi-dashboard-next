/**
 * Fire Statistics Table Component
 * Displays recent fire events in a table
 */

import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from '@tremor/react';
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
    <Card>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        🕒 Letzte Feuer-Events
      </h3>

      {displayEvents.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
          Noch keine Feuer-Events aufgezeichnet
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Zeitpunkt</TableHeaderCell>
              <TableHeaderCell>Temperatur</TableHeaderCell>
              <TableHeaderCell>Typ</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  {format(new Date(event.timestamp), 'dd.MM.yyyy - HH:mm', {
                    locale: de,
                  })}
                </TableCell>
                <TableCell>{event.temperature.toFixed(1)} °C</TableCell>
                <TableCell>
                  <Badge color="orange">
                    {event.event_type === 'fire_started' ? 'Gestartet' : event.event_type}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
