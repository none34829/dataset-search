"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

export function CustomCalendar({
  selected,
  onSelect,
  className
}: CustomCalendarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(selected || new Date())
  const [dateInputValue, setDateInputValue] = React.useState('')
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false)
  const [showYearDropdown, setShowYearDropdown] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement>(null)
  const monthSelectRef = React.useRef<HTMLDivElement>(null)
  const yearSelectRef = React.useRef<HTMLDivElement>(null)

  // Update date input when selected date changes
  React.useEffect(() => {
    if (selected) {
      const month = String(selected.getMonth() + 1).padStart(2, '0')
      const day = String(selected.getDate()).padStart(2, '0')
      const year = selected.getFullYear()
      setDateInputValue(`${month}/${day}/${year}`)
    } else {
      setDateInputValue('')
    }
  }, [selected])

  // Click outside to close calendar and dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      
      if (monthSelectRef.current && !monthSelectRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false)
      }
      
      if (yearSelectRef.current && !yearSelectRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle manual date input
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInputValue(e.target.value)
    
    // Try to parse the date
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = e.target.value.match(datePattern)
    
    if (match) {
      const month = parseInt(match[1], 10) - 1 // 0-based month
      const day = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)
      
      // Check if date is valid
      const date = new Date(year, month, day)
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        onSelect && onSelect(date)
        setCurrentMonth(date)
      }
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    // Get day of week for first day of month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    let firstDayOfMonth = new Date(year, month, 1).getDay()
    // Convert to Monday-based (0 = Monday, ..., 6 = Sunday)
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
    
    const result: { date: Date; isCurrentMonth: boolean }[] = []
    
    // Add days from previous month
    const prevMonth = new Date(year, month, 0)
    const daysInPrevMonth = prevMonth.getDate()
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = daysInPrevMonth - firstDayOfMonth + i + 1
      result.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day),
        isCurrentMonth: false
      })
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      result.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    // Add days from next month
    const nextMonth = new Date(year, month + 1, 1)
    const remainingDays = 42 - result.length // 6 rows of 7 days
    
    for (let i = 1; i <= remainingDays; i++) {
      result.push({
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i),
        isCurrentMonth: false
      })
    }
    
    return result
  }

  const days = getDaysInMonth(currentMonth)

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateSelect = (date: Date, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect && onSelect(date)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect && onSelect(undefined)
    setDateInputValue('')
  }

  const handleToday = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const today = new Date()
    onSelect && onSelect(today)
    setCurrentMonth(today)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    if (!selected) return false
    return date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
  }

  return (
    <div className={cn("relative w-full", className)} ref={calendarRef}>
      <div 
        className="flex items-center border border-gray-300 rounded-md p-2 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          placeholder="mm/dd/yyyy"
          className="w-full border-none focus:outline-none"
          value={dateInputValue}
          onChange={handleDateInputChange}
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
        />
        <CalendarIcon className="h-4 w-4 text-gray-500" />
      </div>

      {isOpen && (
        <div className={cn("absolute z-50 mt-1 bg-white shadow-lg rounded-md overflow-hidden", className)}>
          <div className="p-3">
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              className="w-full border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500 text-sm"
              value={dateInputValue}
              onChange={handleDateInputChange}
            />
          </div>

          <div className="bg-gray-50 p-3">
            {/* Header with month/year and navigation */}
            <div className="flex justify-between items-center px-2 mb-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                }}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                type="button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {/* Month dropdown */}
                <div className="relative" ref={monthSelectRef}>
                  <button 
                    type="button" 
                    className="font-medium flex items-center" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                  >
                    {monthNames[currentMonth.getMonth()]}
                    <span className="text-blue-500">.</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                  
                  {showMonthDropdown && (
                    <div className="absolute z-50 mt-1 bg-white shadow-lg border rounded-md overflow-y-auto max-h-48 w-32">
                      {monthNames.map((month, index) => (
                        <button
                          key={month}
                          type="button"
                          className={cn(
                            "w-full text-left px-2 py-1 text-sm hover:bg-gray-100", 
                            currentMonth.getMonth() === index && "bg-blue-50 text-blue-600"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newDate = new Date(currentMonth);
                            newDate.setMonth(index);
                            setCurrentMonth(newDate);
                            setShowMonthDropdown(false);
                          }}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Year dropdown */}
                <div className="relative" ref={yearSelectRef}>
                  <button 
                    type="button" 
                    className="font-medium flex items-center" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
                    }}
                  >
                    {currentMonth.getFullYear()}
                    <span className="text-blue-500">.</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                  
                  {showYearDropdown && (
                    <div className="absolute z-50 mt-1 bg-white shadow-lg border rounded-md overflow-y-auto max-h-48 w-20">
                      {Array.from({ length: 21 }, (_, i) => {
                        const year = new Date().getFullYear() - 10 + i;
                        return (
                          <button
                            key={year}
                            type="button"
                            className={cn(
                              "w-full text-left px-2 py-1 text-sm hover:bg-gray-100", 
                              currentMonth.getFullYear() === year && "bg-blue-50 text-blue-600"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newDate = new Date(currentMonth);
                              newDate.setFullYear(year);
                              setCurrentMonth(newDate);
                              setShowYearDropdown(false);
                            }}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                }}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
                type="button"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar grid */}
            <div>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-xs text-gray-600 font-normal">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelect && onSelect(day.date);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "h-9 w-9 text-center flex items-center justify-center text-sm",
                      !day.isCurrentMonth && "text-gray-400",
                      isToday(day.date) && !isSelected(day.date) && "font-medium",
                      isSelected(day.date) && "bg-blue-600 text-white rounded-md",
                      !isSelected(day.date) && "hover:bg-gray-100"
                    )}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with Clear and Today buttons */}
          <div className="flex justify-between p-2 text-sm border-t border-gray-200">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect && onSelect(undefined);
                setDateInputValue('');
              }}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
              type="button"
            >
              Clear
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const today = new Date();
                onSelect && onSelect(today);
                setCurrentMonth(today);
              }}
              className="text-blue-600 font-medium hover:text-blue-800 focus:outline-none"
              type="button"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
