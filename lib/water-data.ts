/**
 * Water Consumption Data & Calculations
 * Quelle: https://www.energie-umwelt.ch/wassersparen/den-eigenen-wasserverbrauch-einschaetzen
 */

export interface WaterUsageBreakdown {
  category: string;
  liters: number;
  percentage: number;
}

export interface YearlyConsumption {
  year: string;
  consumption: number; // m³
  isComplete: boolean;
  note?: string;
}

// Schweizer Durchschnitt: 140 Liter pro Person pro Tag
export const SWISS_AVERAGE_DAILY = 140; // Liter
export const SWISS_AVERAGE_YEARLY = 51.1; // m³ per person (140L * 365 / 1000)

// Haushaltsgrösse
export const HOUSEHOLD_SIZE = 2;

// Durchschnittliche Verwendung (Schweizer Durchschnitt in Liter pro Tag)
export const usageBreakdown: WaterUsageBreakdown[] = [
  { category: 'WC-Spülung', liters: 40, percentage: 28.6 },
  { category: 'Bad und Dusche', liters: 36, percentage: 25.7 },
  { category: 'Kochen und Geschirrspülen', liters: 22, percentage: 15.7 },
  { category: 'Waschmaschine', liters: 17, percentage: 12.1 },
  { category: 'Körperpflege', liters: 16, percentage: 11.4 },
  { category: 'Geschirrspüler', liters: 4, percentage: 2.9 },
  { category: 'Anderes', liters: 4, percentage: 2.9 },
  { category: 'Trinkwasser', liters: 1, percentage: 0.7 },
];

// Tatsächlicher Verbrauch
export const yearlyConsumption: YearlyConsumption[] = [
  {
    year: '2022',
    consumption: 5,
    isComplete: false,
    note: 'Einzug September 2022 - unvollständige Daten',
  },
  {
    year: '2023',
    consumption: 25,
    isComplete: true,
  },
  {
    year: '2024',
    consumption: 24,
    isComplete: true,
  },
];

/**
 * Calculate daily consumption per person in liters
 */
export function getDailyConsumptionPerPerson(yearlyM3: number): number {
  return (yearlyM3 * 1000) / 365 / HOUSEHOLD_SIZE;
}

/**
 * Calculate yearly consumption per person in m³
 */
export function getYearlyConsumptionPerPerson(yearlyM3: number): number {
  return yearlyM3 / HOUSEHOLD_SIZE;
}

/**
 * Calculate percentage compared to Swiss average
 */
export function getComparisonToAverage(dailyLiters: number): number {
  return ((dailyLiters - SWISS_AVERAGE_DAILY) / SWISS_AVERAGE_DAILY) * 100;
}

/**
 * Calculate yearly savings in m³ (2 person household)
 */
export function getYearlySavings(yourYearlyM3: number): number {
  const averageForHousehold = SWISS_AVERAGE_YEARLY * HOUSEHOLD_SIZE;
  return averageForHousehold - yourYearlyM3;
}

/**
 * Calculate cost savings (assuming 2 CHF per m³)
 */
export function getCostSavings(savingsM3: number, pricePerM3: number = 2): number {
  return savingsM3 * pricePerM3;
}

/**
 * Get your actual usage breakdown based on your percentage of average
 */
export function getYourUsageBreakdown(dailyLitersPerPerson: number): WaterUsageBreakdown[] {
  const yourPercentage = dailyLitersPerPerson / SWISS_AVERAGE_DAILY;

  return usageBreakdown.map((item) => ({
    ...item,
    liters: Math.round(item.liters * yourPercentage * 10) / 10,
  }));
}

/**
 * Get statistics for the most recent complete year
 */
export function getCurrentYearStats() {
  const currentYear = yearlyConsumption.find((y) => y.year === '2024' && y.isComplete);
  if (!currentYear) return null;

  const dailyPerPerson = getDailyConsumptionPerPerson(currentYear.consumption);
  const yearlyPerPerson = getYearlyConsumptionPerPerson(currentYear.consumption);
  const comparison = getComparisonToAverage(dailyPerPerson);
  const savings = getYearlySavings(currentYear.consumption);
  const costSavings = getCostSavings(savings);

  return {
    year: currentYear.year,
    totalM3: currentYear.consumption,
    dailyPerPerson,
    yearlyPerPerson,
    comparisonPercent: comparison,
    savingsM3: savings,
    costSavings,
  };
}

/**
 * Source information
 */
export const SOURCE_INFO = {
  title: 'Quelle: Durchschnittswerte Schweiz',
  url: 'https://www.energie-umwelt.ch/wassersparen/den-eigenen-wasserverbrauch-einschaetzen',
  description: 'Schweizer Durchschnitt: 140 Liter pro Person und Tag',
};
