/**
 * Timezone utilities for consistent date/time handling
 */

export const getCurrentDateISO = (timezone = 'UTC') => {
  const now = new Date();

  if (timezone !== 'UTC') {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  }

  return now.toISOString().split('T')[0];
};

export const getCurrentTimestampISO = (timezone = 'UTC') => {
  const now = new Date();

  if (timezone !== 'UTC') {
    const offset = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    const offsetString = `${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

    return now.toISOString().replace('Z', offsetString);
  }

  return now.toISOString();
};

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

export const getDayBounds = (date, timezone = 'UTC') => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const dateStr = toISODateString(date, timezone);

  const start = new Date(`${dateStr}T00:00:00`);
  if (timezone !== 'UTC') {
    const offset = start.getTimezoneOffset();
    start.setMinutes(start.getMinutes() - offset);
  }

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

export const isToday = (date, timezone = 'UTC') => {
  const today = getCurrentDateISO(timezone);
  const dateStr = toISODateString(date, timezone);
  return today === dateStr;
};
