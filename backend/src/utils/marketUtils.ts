/**
 * Market Utilities - Helper functions for market data handling
 */

export type Currency = 'USD' | 'INR';
export type Exchange = 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ';

/**
 * Get currency for a given exchange
 */
export function getCurrencyForExchange(exchange: Exchange): Currency {
  switch (exchange) {
    case 'NSE':
    case 'BSE':
      return 'INR';
    case 'NYSE':
    case 'NASDAQ':
      return 'USD';
    default:
      return 'INR'; // Default fallback
  }
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: Currency): string {
  return currency === 'USD' ? '$' : '₹';
}

/**
 * Get currency symbol from exchange
 */
export function getCurrencySymbolFromExchange(exchange: Exchange): string {
  return getCurrencySymbol(getCurrencyForExchange(exchange));
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: Currency, decimals: number = 2): string {
  const symbol = getCurrencySymbol(currency);
  const formattedPrice = price.toFixed(decimals);

  // USD: $123.45, INR: ₹123.45
  return `${symbol}${formattedPrice}`;
}

/**
 * Format price from exchange
 */
export function formatPriceFromExchange(price: number, exchange: Exchange, decimals: number = 2): string {
  return formatPrice(price, getCurrencyForExchange(exchange), decimals);
}

/**
 * Check if market is US market
 */
export function isUSMarket(exchange: Exchange): boolean {
  return exchange === 'NYSE' || exchange === 'NASDAQ';
}

/**
 * Check if market is Indian market
 */
export function isIndianMarket(exchange: Exchange): boolean {
  return exchange === 'NSE' || exchange === 'BSE';
}

/**
 * Get market timezone
 */
export function getMarketTimezone(exchange: Exchange): string {
  return isUSMarket(exchange) ? 'America/New_York' : 'Asia/Kolkata';
}

/**
 * Get market hours for a given exchange
 */
export interface MarketHours {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  timezone: string;
}

export function getMarketHours(exchange: Exchange): MarketHours {
  if (isUSMarket(exchange)) {
    // US markets: 9:30 AM - 4:00 PM EST
    return {
      openHour: 9,
      openMinute: 30,
      closeHour: 16,
      closeMinute: 0,
      timezone: 'America/New_York'
    };
  } else {
    // Indian markets: 9:15 AM - 3:30 PM IST
    return {
      openHour: 9,
      openMinute: 15,
      closeHour: 15,
      closeMinute: 30,
      timezone: 'Asia/Kolkata'
    };
  }
}

/**
 * Check if current time is within market hours for a given exchange
 */
export function isWithinMarketHours(exchange: Exchange, currentTime: Date = new Date()): boolean {
  const marketHours = getMarketHours(exchange);

  // Get current time in market timezone
  const timeString = currentTime.toLocaleString('en-US', { timeZone: marketHours.timezone });
  const marketTime = new Date(timeString);

  const day = marketTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = marketTime.getHours();
  const minute = marketTime.getMinutes();

  // Check if it's a weekday
  const isWeekday = day >= 1 && day <= 5;
  if (!isWeekday) return false;

  // Check if within market hours
  const currentMinutes = hour * 60 + minute;
  const openMinutes = marketHours.openHour * 60 + marketHours.openMinute;
  const closeMinutes = marketHours.closeHour * 60 + marketHours.closeMinute;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}
