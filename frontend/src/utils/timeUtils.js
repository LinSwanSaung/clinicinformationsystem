/**
 * Time conversion and formatting utilities
 */

export const convert12HrTo24Hr = (time12) => {
  if (!time12) {
    return '';
  }

  const [timePart, period] = time12.trim().split(' ');
  if (!timePart || !period) {
    return '';
  }

  const [hours, minutes] = timePart.split(':');
  if (!hours || !minutes) {
    return '';
  }

  let hour24 = parseInt(hours);

  if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  } else if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  }

  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
};

export const convert24HrTo12Hr = (time24) => {
  if (!time24) {
    return '';
  }

  const [hours, minutes] = time24.split(':');
  if (!hours || !minutes) {
    return '';
  }

  let hour = parseInt(hours);
  let period = 'AM';

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

export const validateTimeFormat = (time) => {
  if (!time) {
    return false;
  }
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const compareTimes12Hr = (time1, time2) => {
  const time1_24 = convert12HrTo24Hr(time1);
  const time2_24 = convert12HrTo24Hr(time2);

  if (time1_24 < time2_24) {
    return -1;
  }
  if (time1_24 > time2_24) {
    return 1;
  }
  return 0;
};

export const formatTimeForDisplay = (time, format = '12hr') => {
  if (!time) {
    return '';
  }

  const is12Hr = time.includes('AM') || time.includes('PM');

  if (format === '12hr') {
    return is12Hr ? time : convert24HrTo12Hr(time);
  } else {
    return is12Hr ? convert12HrTo24Hr(time) : time;
  }
};

export const formatTimeRange = (startTime, endTime, format = '12hr') => {
  const formattedStart = formatTimeForDisplay(startTime, format);
  const formattedEnd = formatTimeForDisplay(endTime, format);

  if (!formattedStart || !formattedEnd) {
    return '';
  }

  return `${formattedStart} - ${formattedEnd}`;
};
