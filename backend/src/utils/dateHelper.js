/**
 * Date utility functions
 */

/**
 * Format date to ISO string
 */
export const formatToISO = (date) => {
  return new Date(date).toISOString();
};

/**
 * Get date string in YYYY-MM-DD format
 */
export const getDateString = (date = new Date()) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get time difference in human readable format
 */
export const getTimeDifference = (date1, date2 = new Date()) => {
  const diffInMs = Math.abs(new Date(date2) - new Date(date1));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  }
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  if (diffInDays < 30) {
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  }
  if (diffInDays < 365) {
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  return `${Math.floor(diffInDays / 365)} years ago`;
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);

  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Get start and end of day
 */
export const getDayBounds = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};
