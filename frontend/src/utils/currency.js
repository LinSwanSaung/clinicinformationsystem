import clinicSettingsService from '@/services/clinicSettingsService';

// Cache for currency settings
let currencyCache = {
  currency_code: 'USD',
  currency_symbol: '$',
  lastUpdated: 0,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
};

/**
 * Load currency settings from API
 */
async function loadCurrencySettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && now - currencyCache.lastUpdated < currencyCache.cacheDuration) {
    return {
      currency_code: currencyCache.currency_code,
      currency_symbol: currencyCache.currency_symbol,
    };
  }

  try {
    const result = await clinicSettingsService.getSettings();
    if (result.success && result.data) {
      const data = result.data.data || result.data;
      currencyCache = {
        currency_code: data.currency_code || 'USD',
        currency_symbol: data.currency_symbol || '$',
        lastUpdated: now,
        cacheDuration: 5 * 60 * 1000,
      };
      return {
        currency_code: currencyCache.currency_code,
        currency_symbol: currencyCache.currency_symbol,
      };
    }
  } catch (error) {
    // Silently fail and use cached/default values
    // Don't log errors during initialization to avoid console spam
    // Only use default values if cache hasn't been set yet
    if (currencyCache.lastUpdated === 0) {
      // First time, use defaults
      currencyCache.lastUpdated = now;
    }
  }

  return {
    currency_code: currencyCache.currency_code,
    currency_symbol: currencyCache.currency_symbol,
  };
}

/**
 * Format amount with currency symbol
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {Promise<string>} Formatted currency string
 */
export async function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const { currency_symbol } = await loadCurrencySettings();
  const {
    showSymbol = true,
    decimals = 2,
    symbolPosition = 'before', // 'before' or 'after'
  } = options;

  const formattedAmount = parseFloat(amount).toFixed(decimals);

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
 * Use this in React components with useState/useEffect
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrencySync(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const { currency_symbol } = currencyCache;
  const { showSymbol = true, decimals = 2, symbolPosition = 'before' } = options;

  const formattedAmount = parseFloat(amount).toFixed(decimals);

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
 * Get currency symbol (cached)
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol() {
  return currencyCache.currency_symbol || '$';
}

/**
 * Get currency code (cached)
 * @returns {string} Currency code
 */
export function getCurrencyCode() {
  return currencyCache.currency_code || 'USD';
}

/**
 * Clear currency cache (call after updating settings)
 */
export function clearCurrencyCache() {
  currencyCache.lastUpdated = 0;
}

/**
 * Refresh currency cache immediately (force reload from API)
 */
export async function refreshCurrencyCache() {
  await loadCurrencySettings(true);
}

/**
 * Initialize currency cache (call on app load or after authentication)
 * This is safe to call multiple times - it will use cache if available
 */
export async function initCurrencyCache() {
  try {
    await loadCurrencySettings();
  } catch (error) {
    // Silently fail - will use defaults
    // Currency will be loaded when first needed
  }
}
