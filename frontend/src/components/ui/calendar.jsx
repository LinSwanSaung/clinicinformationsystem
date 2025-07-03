import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Calendar({
  className,
  classNames,
  selected,
  onSelect,
  ...props
}) {
  return (
    <div className={cn("p-0", className)} {...props}>
      <div className="space-y-4">
        {/* Month/Year Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            onClick={() => onSelect && onSelect(new Date())}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="sr-only">Go to today</span>
          </Button>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 text-center text-sm">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="p-0 text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center text-sm">
          {Array(35)
            .fill(null)
            .map((_, i) => {
              const date = new Date(2025, 5, i + 1);
              const isSelected = selected?.toDateString() === date.toDateString();
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <Button
                  key={i}
                  variant="ghost"
                  className={cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                    isToday && "text-primary",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onSelect && onSelect(date)}
                >
                  <time dateTime={date.toISOString()}>{date.getDate()}</time>
                </Button>
              );
            })}
        </div>
      </div>
    </div>
  )
}
