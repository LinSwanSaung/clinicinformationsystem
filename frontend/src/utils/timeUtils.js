/**
 * Utility functions for time conversion and formatting
 * Matches the backend time conversion functions for consistency
 */

/**
 * Convert 12-hour time format to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., "9:00 AM", "2:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "09:00", "14:30")
 */
export const convert12HrTo24Hr = (time12) => {
  if (!time12) return '';

  // Extract time and period
  const [timePart, period] = time12.trim().split(' ');
  if (!timePart || !period) return '';

  const [hours, minutes] = timePart.split(':');
  if (!hours || !minutes) return '';

  let hour24 = parseInt(hours);

  // Convert to 24-hour format
  if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  } else if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  }

  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Convert 24-hour time format to 12-hour format
 * @param {string} time24 - Time in 24-hour format (e.g., "09:00", "14:30")
 * @returns {string} Time in 12-hour format (e.g., "9:00 AM", "2:30 PM")
 */
export const convert24HrTo12Hr = (time24) => {
  if (!time24) return '';

  const [hours, minutes] = time24.split(':');
  if (!hours || !minutes) return '';

  let hour = parseInt(hours);
  let period = 'AM';

  // Convert to 12-hour format
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
    period = 'PM';
  } else if (hour === 12) {
    period = 'PM';
  }

  return `${hour}:${minutes} ${period}`;
};

/**
 * Validate time format (H:MM or HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid format
 */
export const validateTimeFormat = (time) => {
  if (!time) return false;
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Compare two times in 12-hour format
 * @param {string} time1 - First time (e.g., "9:00 AM")
 * @param {string} time2 - Second time (e.g., "5:00 PM")
 * @returns {number} -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export const compareTimes12Hr = (time1, time2) => {
  const time1_24 = convert12HrTo24Hr(time1);
  const time2_24 = convert12HrTo24Hr(time2);

  if (time1_24 < time2_24) return -1;
  if (time1_24 > time2_24) return 1;
  return 0;
};

/**
 * Format time display for UI
 * @param {string} time - Time in any format
 * @param {string} format - Target format ('12hr' or '24hr')
 * @returns {string} Formatted time string
 */
export const formatTimeForDisplay = (time, format = '12hr') => {
  if (!time) return '';

  // Detect if input is 12hr or 24hr format
  const is12Hr = time.includes('AM') || time.includes('PM');

  if (format === '12hr') {
    return is12Hr ? time : convert24HrTo12Hr(time);
  } else {
    return is12Hr ? convert12HrTo24Hr(time) : time;
  }
};

/**
 * Create time range display string
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @param {string} format - Format ('12hr' or '24hr')
 * @returns {string} Time range string (e.g., "9:00 AM - 5:00 PM")
 */
export const formatTimeRange = (startTime, endTime, format = '12hr') => {
  const formattedStart = formatTimeForDisplay(startTime, format);
  const formattedEnd = formatTimeForDisplay(endTime, format);

  if (!formattedStart || !formattedEnd) return '';

  return `${formattedStart} - ${formattedEnd}`;
};
