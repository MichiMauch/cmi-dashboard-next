/**
 * Oven Status Badge Component
 * Displays the current oven state
 */

import { OvenState } from '@/types/dashboard';

interface OvenStatusBadgeProps {
  state: OvenState;
}

const STATE_CONFIG = {
  cold: { label: '❄️ KALT', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  warming: { label: '📈 AUFWÄRMEN', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  hot: { label: '🔥 HEISS', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  cooling: { label: '📉 ABKÜHLEN', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

export function OvenStatusBadge({ state }: OvenStatusBadgeProps) {
  const config = STATE_CONFIG[state.state];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">Ofen Status:</span>
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}
