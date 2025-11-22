/**
 * Temperature Gauge Card Component
 * Displays a temperature reading with a circular progress indicator
 */

import { CurrentTemperature } from '@/types/dashboard';

interface TempGaugeCardProps {
  temp: CurrentTemperature;
  isOven?: boolean;
}

export function TempGaugeCard({ temp, isOven = false }: TempGaugeCardProps) {
  // Calculate percentage for progress circle
  const maxTemp = isOven ? 200 : 100;
  const percentage = Math.min((temp.wert / maxTemp) * 100, 100);

  // Determine color based on temperature and type
  const getColor = () => {
    if (isOven) {
      if (temp.wert < 40) return 'text-blue-600';
      if (temp.wert < 60) return 'text-green-600';
      if (temp.wert < 100) return 'text-yellow-600';
      return 'text-orange-600';
    } else {
      if (temp.wert < 20) return 'text-blue-600';
      if (temp.wert < 40) return 'text-green-600';
      if (temp.wert < 60) return 'text-yellow-600';
      return 'text-orange-600';
    }
  };

  const getBgColor = () => {
    if (isOven) {
      if (temp.wert < 40) return 'bg-blue-500';
      if (temp.wert < 60) return 'bg-green-500';
      if (temp.wert < 100) return 'bg-yellow-500';
      return 'bg-orange-500';
    } else {
      if (temp.wert < 20) return 'bg-blue-500';
      if (temp.wert < 40) return 'bg-green-500';
      if (temp.wert < 60) return 'bg-yellow-500';
      return 'bg-orange-500';
    }
  };

  // Calculate stroke-dashoffset for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-center font-medium text-slate-900 dark:text-slate-100">
          {temp.ort || `Sensor ${temp.nummer}`}
        </h3>

        {/* Circular Progress */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={getColor()}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease'
              }}
            />
          </svg>
          {/* Temperature text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {temp.wert.toFixed(1)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              °C
            </span>
          </div>
        </div>

        {isOven && temp.wert >= 60 && (
          <div className="flex items-center space-x-1 text-sm text-orange-600 dark:text-orange-400">
            <span>🔥</span>
            <span>Feuer aktiv</span>
          </div>
        )}
      </div>
    </div>
  );
}
