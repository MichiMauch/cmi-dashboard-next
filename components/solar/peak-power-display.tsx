/**
 * Peak Power Display Component
 * Shows today's peak solar power with real-time updates
 */

'use client';

import React, { useEffect, useState } from 'react';

interface PeakPowerData {
  timestamp: number;
  peak_power: number;
}

export function PeakPowerDisplay() {
  const [peakPowerData, setPeakPowerData] = useState<PeakPowerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/solar/peak');
      if (!res.ok) {
        throw new Error('Failed to fetch peak power data');
      }
      const data = await res.json();
      setPeakPowerData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching peak power data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col px-4 py-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col px-4 py-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <p className="text-red-500 dark:text-red-400">Fehler beim Laden</p>
      </div>
    );
  }

  if (!peakPowerData) {
    return (
      <div className="flex flex-col px-4 py-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <p className="text-slate-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4 overflow-hidden bg-white dark:bg-slate-800 hover:bg-gradient-to-br hover:from-purple-400 hover:via-blue-400 hover:to-blue-500 rounded-xl shadow-lg duration-300 hover:shadow-2xl group">
      <div className="flex flex-row justify-between items-center">
        <div className="px-4 py-4 bg-slate-200 dark:bg-slate-700 rounded-xl bg-opacity-30">
          <span className="text-cyan-500 text-3xl">⚡</span>
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-slate-700 dark:text-slate-100 mt-6 group-hover:text-white">
        {peakPowerData.peak_power.toFixed(2)} W
      </h1>
      <div className="flex flex-col text-slate-700 dark:text-slate-300 group-hover:text-slate-100">
        <p className="font-medium">Heutiger Peak</p>
      </div>
    </div>
  );
}
