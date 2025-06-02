"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useNavigation } from "react-day-picker"
import type { DayClickEventHandler } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker> & {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}

// Custom caption component for the calendar with month and year display
function CustomCaption({ displayMonth }: { displayMonth: Date }) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  return (
    <div className="flex justify-between items-center px-2 w-full">
      <button
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className="text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      <div className="flex flex-row items-center justify-center gap-1">
        <span className="font-medium">
          {months[displayMonth.getMonth()]}
          <span className="text-blue-500">.</span>
        </span>
        <span className="font-medium">
          {displayMonth.getFullYear()}
          <span className="text-blue-500">.</span>
        </span>
      </div>
      
      <button
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className="text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  ...props
}: EnhancedCalendarProps) {
  const [dateInputValue, setDateInputValue] = React.useState('');
  
  // Update date input when selected date changes
  React.useEffect(() => {
    if (selected instanceof Date) {
      const month = String(selected.getMonth() + 1).padStart(2, '0');
      const day = String(selected.getDate()).padStart(2, '0');
      const year = selected.getFullYear();
      setDateInputValue(`${month}/${day}/${year}`);
    } else {
      setDateInputValue('');
    }
  }, [selected]);

  // Handle manual date input
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInputValue(e.target.value);
    
    // Try to parse the date
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = e.target.value.match(datePattern);
    
    if (match) {
      const month = parseInt(match[1], 10) - 1; // 0-based month
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      // Check if date is valid
      const date = new Date(year, month, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        if (onSelect) {
          onSelect(date);
        }
      }
    }
  };
  
  const handleClear = () => {
    if (onSelect) {
      onSelect(undefined);
    }
    setDateInputValue('');
  };
  
  const handleToday = () => {
    const today = new Date();
    if (onSelect) {
      onSelect(today);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Manual date input */}
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="mm/dd/yyyy"
          className={cn("w-full border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500 text-sm", className)}
          value={dateInputValue}
          onChange={handleDateInputChange}
        />
      </div>
      
      <DayPicker
        mode="single"
        showOutsideDays={showOutsideDays}
        className={cn("p-0", className)}
        weekStartsOn={1} /* Start week on Monday */
        selected={selected as any}
        onSelect={onSelect as any}
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-0 p-3 bg-gray-50 rounded-md",
          caption: "flex justify-center pt-1 pb-2 relative items-center",
          caption_label: "hidden", // Hide default caption as we use custom one
          nav: "hidden", // Hide default nav as we use custom one
          nav_button: "hidden", // Hide default nav buttons as we use custom ones
          nav_button_previous: "hidden",
          nav_button_next: "hidden",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "text-gray-600 rounded-md w-9 font-normal text-xs justify-center items-center flex",
          row: "flex w-full mt-1",
          cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-9 w-9 p-0 font-normal hover:bg-gray-100 flex items-center justify-center",
          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
          day_today: "text-black font-medium",
          day_outside: "text-gray-400",
          day_disabled: "text-gray-300 opacity-50",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          Caption: ({ displayMonth }) => <CustomCaption displayMonth={displayMonth} />,
        }}
        
        footer={
          <div className="flex justify-between p-2 text-sm">
            <button 
              onClick={handleClear}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              Clear
            </button>
            <button 
              onClick={handleToday}
              className="text-blue-600 font-medium hover:text-blue-800 focus:outline-none"
            >
              Today
            </button>
          </div>
        }
        {...props}
      />
    </div>
  )
}
EnhancedCalendar.displayName = "EnhancedCalendar"

export { EnhancedCalendar }
