/**
 * Oven Status Badge Component
 * Displays the current oven state
 */

import { Badge } from '@tremor/react';
import { OvenState } from '@/types/dashboard';

interface OvenStatusBadgeProps {
  state: OvenState;
}

const STATE_CONFIG = {
  cold: { label: '❄️ KALT', color: 'blue' as const },
  warming: { label: '📈 AUFWÄRMEN', color: 'yellow' as const },
  hot: { label: '🔥 HEISS', color: 'orange' as const },
  cooling: { label: '📉 ABKÜHLEN', color: 'green' as const },
};

export function OvenStatusBadge({ state }: OvenStatusBadgeProps) {
  const config = STATE_CONFIG[state.state];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">Ofen Status:</span>
      <Badge size="lg" color={config.color}>
        {config.label}
      </Badge>
    </div>
  );
}
