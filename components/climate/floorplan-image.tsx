/**
 * FloorplanImage Component
 * Displays the appropriate floorplan image based on the current theme
 */

'use client';

import Image from 'next/image';
import { useThemeMode } from '@/components/providers/theme-provider';

export function FloorplanImage() {
  const { mode } = useThemeMode();
  const imageSrc = mode === 'dark' ? '/images/floorplan-dark.jpg' : '/images/floorplan.jpg';

  return (
    <Image
      src={imageSrc}
      alt="Hausgrundriss"
      width={1000}
      height={600}
      style={{ width: '100%', height: 'auto' }}
      priority
    />
  );
}
