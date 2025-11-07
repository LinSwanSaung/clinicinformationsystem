import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Calendar({ className, selected, onSelect, ...props }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);

    // Prevent going to past months
    const today = new Date();
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (newMonth < minMonth) {
      return;
    }

    setCurrentMonth(newMonth);
  };

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
  const today = new Date();
  const canGoBack = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className={cn('p-1 sm:p-2 md:p-3 lg:p-4', className)} {...props}>
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {/* Month/Year Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
            onClick={() => navigateMonth(-1)}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
          </Button>
          <h2 className="text-xs font-medium leading-tight sm:text-sm sm:font-semibold md:text-base lg:text-lg">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10"
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

            return (
              <Button
                key={i}
                variant="ghost"
                className={cn(
                  'h-6 w-full border-0 p-0 font-normal sm:h-7 sm:border md:h-9 lg:h-12',
                  !isCurrentMonth && 'text-muted-foreground opacity-50',
                  isToday && 'bg-primary/10 font-semibold text-primary',
                  isSelected && 'hover:bg-primary/90 bg-primary text-primary-foreground',
                  isPast && isCurrentMonth && 'opacity-60'
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
