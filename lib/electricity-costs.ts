/**
 * Electricity Cost Calculations
 * Based on Swiss average electricity prices (paid to neighbor)
 * Source: https://www.strompreis.elcom.admin.ch/map (Reference for CH average)
 */

// Swiss average electricity price: 27.7 Rappen per kWh
export const SWISS_ELECTRICITY_PRICE_CHF_PER_KWH = 0.277;
export const ELECTRICITY_PRICE_SOURCE = 'https://www.strompreis.elcom.admin.ch/map';
export const ELECTRICITY_PRICE_RAPPEN = 27.7;

export interface ElectricityCosts {
  neighborCost: number; // Cost paid to neighbor for grid electricity
  solarSavings: number; // Money saved by using own solar power
  costWithoutSolar: number; // What it would cost without solar installation
  selfConsumption: number; // kWh consumed from own solar
}

/**
 * Calculate daily electricity costs
 * @param consumption Total daily consumption in kWh
 * @param gridImport Electricity imported from neighbor in kWh
 * @returns Cost breakdown
 */
export function calculateDailyCosts(
  consumption: number,
  gridImport: number
): ElectricityCosts {
  const neighborCost = gridImport * SWISS_ELECTRICITY_PRICE_CHF_PER_KWH;
  const selfConsumption = Math.max(0, consumption - gridImport);
  const solarSavings = selfConsumption * SWISS_ELECTRICITY_PRICE_CHF_PER_KWH;
  const costWithoutSolar = consumption * SWISS_ELECTRICITY_PRICE_CHF_PER_KWH;

  return {
    neighborCost,
    solarSavings,
    costWithoutSolar,
    selfConsumption,
  };
}

/**
 * Calculate monthly electricity costs
 * @param consumption Total monthly consumption in kWh
 * @param gridImport Electricity imported from neighbor in kWh
 * @returns Cost breakdown
 */
export function calculateMonthlyCosts(
  consumption: number,
  gridImport: number
): ElectricityCosts {
  return calculateDailyCosts(consumption, gridImport);
}

/**
 * Calculate yearly electricity costs
 * @param consumption Total yearly consumption in kWh
 * @param gridImport Electricity imported from neighbor in kWh
 * @returns Cost breakdown
 */
export function calculateYearlyCosts(
  consumption: number,
  gridImport: number
): ElectricityCosts {
  return calculateDailyCosts(consumption, gridImport);
}

/**
 * Format amount as Swiss Francs
 * @param amount Amount in CHF
 * @returns Formatted string (e.g., "CHF 12.34")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount as Rappen (cents)
 * @param amount Amount in CHF
 * @returns Formatted string (e.g., "1234 Rp")
 */
export function formatRappen(amount: number): string {
  const rappen = Math.round(amount * 100);
  return `${rappen} Rp`;
}
