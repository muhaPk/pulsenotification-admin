// Bitcoin utility functions
export const SATOSHIS_PER_BTC = 100000000; // 1 BTC = 100,000,000 satoshis

/**
 * Convert satoshis to BTC
 * @param satoshis - Balance in satoshis (as string from BigInt)
 * @returns Balance in BTC as number
 */
export const satoshisToBTC = (satoshis: string): number => {
  return parseInt(satoshis) / SATOSHIS_PER_BTC;
};

/**
 * Convert BTC to satoshis
 * @param btc - Balance in BTC
 * @returns Balance in satoshis as string
 */
export const btcToSatoshis = (btc: number): string => {
  return Math.floor(btc * SATOSHIS_PER_BTC).toString();
};

/**
 * Format BTC balance for display
 * @param satoshis - Balance in satoshis (as string from BigInt)
 * @param decimals - Number of decimal places (default: 8)
 * @returns Formatted BTC string
 */
export const formatBTC = (satoshis: string, decimals: number = 8): string => {
  const btc = satoshisToBTC(satoshis);
  return btc.toFixed(decimals);
};
