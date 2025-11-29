import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Calendar Component
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 * @param {Date} props.selected - Currently selected date
 * @param {function} props.onSelect - Callback when a date is selected
 * @param {boolean} props.allowPastDates - Allow selecting dates in the past (for DOB selection)
 * @param {number} props.yearRangeStart - Start year for year dropdown (default: 100 years ago)
 * @param {number} props.yearRangeEnd - End year for year dropdown (default: current year)
 */
export function Calendar({
  className,
  selected,
  onSelect,
  allowPastDates = false,
  yearRangeStart,
  yearRangeEnd,
  ...props
}) {
  const today = new Date();
  const defaultYearStart = yearRangeStart ?? today.getFullYear() - 100;
  const defaultYearEnd = yearRangeEnd ?? today.getFullYear();

  const [currentMonth, setCurrentMonth] = useState(() => {
    // If a date is already selected, start from that date's month/year
    if (selected) {
      return new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);

    // Only prevent going to past months if allowPastDates is false
    if (!allowPastDates) {
      const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      if (newMonth < minMonth) {
        return;
      }
    }

    setCurrentMonth(newMonth);
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value, 10);
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
  };

  const handleMonthChange = (e) => {
    const month = parseInt(e.target.value, 10);
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
  };

  // Generate year options
  const years = [];
  for (let y = defaultYearEnd; y >= defaultYearStart; y--) {
    years.push(y);
  }

  // Month names
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = generateCalendarDays();
  const canGoBack =
    allowPastDates || currentMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className={cn('p-1 sm:p-2 md:p-3 lg:p-4', className)} {...props}>
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {/* Month/Year Navigation */}
        <div className="flex items-center justify-between gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 shrink-0 p-0 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
            onClick={() => navigateMonth(-1)}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
          </Button>

          {allowPastDates ? (
            // Show dropdowns for year and month selection (for DOB)
            <div className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
              <select
                value={currentMonth.getMonth()}
                onChange={handleMonthChange}
                className="h-6 rounded border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring sm:h-7 sm:px-2 sm:text-sm md:h-8"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={idx}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={currentMonth.getFullYear()}
                onChange={handleYearChange}
                className="h-6 rounded border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring sm:h-7 sm:px-2 sm:text-sm md:h-8"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // Show static month/year text (for appointments)
            <h2 className="text-xs font-medium leading-tight sm:text-sm sm:font-semibold md:text-base lg:text-lg">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 shrink-0 p-0 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs md:text-sm lg:text-base">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div
              key={idx}
              className="flex h-5 items-center justify-center p-0 font-medium text-muted-foreground sm:h-6 md:h-9 lg:h-10"
            >
              <span className="hidden sm:inline">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][idx]}
              </span>
              <span className="sm:hidden">{day}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] sm:gap-1 sm:text-xs md:text-sm lg:text-base">
          {days.map((date, i) => {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);

            const isSelected = selected?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === todayDate.toDateString();
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isPast = checkDate < todayDate;
            // For DOB selection (allowPastDates), don't show future dates as available
            const isFuture = checkDate > todayDate;

            return (
              <Button
                key={i}
                variant="ghost"
                disabled={allowPastDates && isFuture}
                className={cn(
                  'h-6 w-full border-0 p-0 font-normal sm:h-7 sm:border md:h-9 lg:h-12',
                  !isCurrentMonth && 'text-muted-foreground opacity-50',
                  isToday && 'bg-primary/10 font-semibold text-primary',
                  isSelected && 'hover:bg-primary/90 bg-primary text-primary-foreground',
                  // Only show past dates as faded if NOT allowing past dates (appointments mode)
                  isPast && isCurrentMonth && !allowPastDates && 'opacity-60',
                  // Show future dates as faded if allowing past dates (DOB mode)
                  isFuture && allowPastDates && 'opacity-40'
                )}
                onClick={() => onSelect && onSelect(date)}
              >
                {date.getDate()}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
