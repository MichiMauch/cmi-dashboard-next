/**
 * Temperature Gauge Card Component
 * Displays a temperature reading with a progress circle
 */

import { Card, ProgressCircle, Text } from '@tremor/react';
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
      if (temp.wert < 40) return 'blue';
      if (temp.wert < 60) return 'green';
      if (temp.wert < 100) return 'yellow';
      return 'orange';
    } else {
      if (temp.wert < 20) return 'blue';
      if (temp.wert < 40) return 'green';
      if (temp.wert < 60) return 'yellow';
      return 'orange';
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <div className="flex flex-col items-center space-y-4">
        <Text className="text-center font-medium">{temp.ort || `Sensor ${temp.nummer}`}</Text>

        <ProgressCircle value={percentage} size="xl" color={getColor()}>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {temp.wert.toFixed(1)}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            °C
          </span>
        </ProgressCircle>

        {isOven && temp.wert >= 60 && (
          <div className="flex items-center space-x-1 text-sm text-orange-600 dark:text-orange-400">
            <span>🔥</span>
            <Text>Feuer aktiv</Text>
          </div>
        )}
      </div>
    </Card>
  );
}
