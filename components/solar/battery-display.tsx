/**
 * Battery Display Component
 * Circular SVG gauge showing battery charge percentage with color zones
 */

import React from 'react';

interface BatteryDisplayProps {
  charge: number; // Battery charge percentage (0-100)
}

export function BatteryDisplay({ charge }: BatteryDisplayProps) {
  const radius = 80;
  const strokeWidth = 25;
  const circumference = 2 * Math.PI * radius;

  // Color zones based on charge level
  // Red: 0-25% (90 degrees)
  const redSectionDegrees = 90;
  const redSectionFraction = redSectionDegrees / 360;
  const redDasharray = circumference * redSectionFraction;

  // Orange: 25-60% (125 degrees)
  const orangeSectionDegrees = 125;
  const orangeSectionFraction = orangeSectionDegrees / 360;
  const orangeDasharray = circumference * orangeSectionFraction;

  // Green: 60-100% (144 degrees)
  const greenSectionDegrees = 144;
  const greenSectionFraction = greenSectionDegrees / 360;
  const greenDasharray = circumference * greenSectionFraction;

  // Position calculations (in degrees, adjusted for -90deg rotation)
  const position25 = 25 * 3.6;
  const position60 = 60 * 3.6;
  const position100 = 100 * 3.6;
  const positionCharge = charge * 3.6 - 1;

  // Calculate X,Y coordinates for markers on the stroke
  const markX = (angle: number) =>
    100 + (radius - strokeWidth / 100) * Math.cos((angle * Math.PI) / 180);
  const markY = (angle: number) =>
    100 + (radius - strokeWidth / 100) * Math.sin((angle * Math.PI) / 180);

  // Calculate X,Y coordinates for the charge indicator dot
  const innerMarkX = (angle: number) =>
    100 + radius * Math.cos((angle * Math.PI) / 180);
  const innerMarkY = (angle: number) =>
    100 + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="relative flex items-center justify-center h-full bg-white dark:bg-slate-800 shadow-md rounded-xl p-4 transition-all duration-300 hover:shadow-2xl group hover:bg-gradient-to-br hover:from-purple-400 hover:via-blue-400 hover:to-blue-500">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E5E7EB"
          fill="transparent"
        />

        {/* Red zone (0-25%) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#EF4444"
          fill="transparent"
          strokeDasharray={`${redDasharray} ${circumference}`}
          strokeDashoffset={0}
        />

        {/* Orange zone (25-60%) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#F59E0B"
          fill="transparent"
          strokeDasharray={`${orangeDasharray} ${circumference}`}
          strokeDashoffset={-redDasharray}
        />

        {/* Green zone (60-100%) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#34D399"
          fill="transparent"
          strokeDasharray={`${greenDasharray} ${circumference}`}
          strokeDashoffset={-(redDasharray + orangeDasharray)}
        />

        {/* 25% marker */}
        <text
          x={markX(position25)}
          y={markY(position25)}
          textAnchor="middle"
          fill="black"
          fontSize="12"
          dy=".3em"
          transform={`rotate(${position25} ${markX(position25)} ${markY(position25)})`}
        >
          25%
        </text>

        {/* 60% marker */}
        <text
          x={markX(position60)}
          y={markY(position60)}
          textAnchor="middle"
          fill="black"
          fontSize="12"
          dy=".3em"
          transform={`rotate(${position60 + (position60 > 180 ? 180 : 0)} ${markX(position60)} ${markY(position60)})`}
        >
          60%
        </text>

        {/* 100% marker */}
        <text
          x={markX(position100)}
          y={markY(position100)}
          textAnchor="middle"
          fill="black"
          fontSize="12"
          dy=".3em"
          transform={`rotate(90 ${markX(position100)} ${markY(position100)})`}
        >
          100%
        </text>

        {/* Current charge indicator dot */}
        <circle
          cx={innerMarkX(positionCharge)}
          cy={innerMarkY(positionCharge)}
          r="8"
          fill="black"
          stroke="black"
          strokeWidth="2"
        />
      </svg>

      {/* Center text display */}
      <div className="absolute flex flex-col items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="text-3xl sm:text-4xl xl:text-5xl font-bold text-slate-700 dark:text-slate-100 mt-6 group-hover:text-white">
          {charge.toFixed(1)}%
        </span>
        <div className="text-slate-700 dark:text-slate-300 group-hover:text-slate-100 mt-1 text-sm">
          Batterieladung
        </div>
      </div>
    </div>
  );
}
