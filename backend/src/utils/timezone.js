/**
 * Timezone utilities for consistent date/time handling
 * Ensures all timestamps are timezone-aware and consistent
 */

/**
 * Get current date in ISO format (YYYY-MM-DD) in the clinic's timezone
 * Defaults to UTC if timezone not specified
 */
export const getCurrentDateISO = (timezone = 'UTC') => {
  const now = new Date();
  
  // Convert to specified timezone
  if (timezone !== 'UTC') {
    // Use Intl.DateTimeFormat to get date in specified timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  }
  
  // Default to UTC
  return now.toISOString().split('T')[0];
};

/**
 * Get current timestamp in ISO format with timezone
 */
export const getCurrentTimestampISO = (timezone = 'UTC') => {
  const now = new Date();
  
  if (timezone !== 'UTC') {
    // Format with timezone offset
    const offset = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    const offsetString = `${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
    
    return now.toISOString().replace('Z', offsetString);
  }
  
  return now.toISOString();
};

/**
 * Convert date to ISO date string (YYYY-MM-DD) in specified timezone
 */
export const toISODateString = (date, timezone = 'UTC') => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  if (timezone !== 'UTC') {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Get start and end of day in ISO format for a given date and timezone
 */
export const getDayBounds = (date, timezone = 'UTC') => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const dateStr = toISODateString(date, timezone);
  
  // Create start of day (00:00:00)
  const start = new Date(`${dateStr}T00:00:00`);
  if (timezone !== 'UTC') {
    // Adjust for timezone offset
    const offset = start.getTimezoneOffset();
    start.setMinutes(start.getMinutes() - offset);
  }
  
  // Create end of day (23:59:59.999)
  const end = new Date(`${dateStr}T23:59:59.999`);
  if (timezone !== 'UTC') {
    const offset = end.getTimezoneOffset();
    end.setMinutes(end.getMinutes() - offset);
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    dateStr,
  };
};

/**
 * Check if a date is today in the specified timezone
 */
export const isToday = (date, timezone = 'UTC') => {
  const today = getCurrentDateISO(timezone);
  const dateStr = toISODateString(date, timezone);
  return today === dateStr;
};

