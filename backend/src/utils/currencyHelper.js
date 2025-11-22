import clinicSettingsService from '../services/ClinicSettings.service.js';
import logger from '../config/logger.js';

/**
 * Currency Helper Utility
 * Provides currency formatting functions using clinic settings
 */

// Cache for currency settings (refresh every 5 minutes)
let currencyCache = {
  currency_code: 'USD',
  currency_symbol: '$',
  lastUpdated: 0,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
};

/**
 * Get currency settings (with caching)
 */
async function getCurrencySettings() {
  const now = Date.now();
  if (now - currencyCache.lastUpdated < currencyCache.cacheDuration) {
    return {
      currency_code: currencyCache.currency_code,
      currency_symbol: currencyCache.currency_symbol,
    };
  }

  try {
    const settings = await clinicSettingsService.getCurrencySettings();
    currencyCache = {
      currency_code: settings.currency_code,
      currency_symbol: settings.currency_symbol,
      lastUpdated: now,
      cacheDuration: 5 * 60 * 1000,
    };
    return settings;
  } catch (error) {
    logger.error('Error fetching currency settings:', error);
    return {
      currency_code: 'USD',
      currency_symbol: '$',
    };
  }
}

/**
 * Format amount with currency symbol
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export async function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const { currency_code, currency_symbol } = await getCurrencySettings();
  const { 
    showSymbol = true, 
    decimals = 2, 
    useCode = false,
    symbolPosition = 'before' // 'before' or 'after'
  } = options;

  const formattedAmount = parseFloat(amount).toFixed(decimals);
  
  if (useCode) {
    // Use ISO currency code (e.g., "USD 100.00" or "MMK 100.00")
    return `${currency_code} ${formattedAmount}`;
  }

  if (showSymbol) {
    if (symbolPosition === 'after') {
      return `${formattedAmount} ${currency_symbol}`;
    } else {
      return `${currency_symbol}${formattedAmount}`;
    }
  }

  return formattedAmount;
}

/**
 * Format currency synchronously (uses cached value)
 * Use this when you can't use async/await
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrencySync(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const { currency_code, currency_symbol } = currencyCache;
  const { 
    showSymbol = true, 
    decimals = 2, 
    useCode = false,
    symbolPosition = 'before'
  } = options;

  const formattedAmount = parseFloat(amount).toFixed(decimals);
  
  if (useCode) {
    return `${currency_code} ${formattedAmount}`;
  }

  if (showSymbol) {
    if (symbolPosition === 'after') {
      return `${formattedAmount} ${currency_symbol}`;
    } else {
      return `${currency_symbol}${formattedAmount}`;
    }
  }

  return formattedAmount;
}

/**
 * Get currency symbol
 * @returns {Promise<string>} Currency symbol
 */
export async function getCurrencySymbol() {
  const settings = await getCurrencySettings();
  return settings.currency_symbol;
}

/**
 * Get currency code
 * @returns {Promise<string>} Currency code
 */
export async function getCurrencyCode() {
  const settings = await getCurrencySettings();
  return settings.currency_code;
}

/**
 * Clear currency cache (useful after updating settings)
 */
export function clearCurrencyCache() {
  currencyCache.lastUpdated = 0;
}

