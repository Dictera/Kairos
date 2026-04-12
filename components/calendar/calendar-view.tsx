"use client"

import * as React from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale/tr"

import { Calendar } from "@/components/ui/calendar"
import { CalendarDayCell } from "./calendar-day-cell"
import { CalendarEventPopover, type CalendarEvent } from "./calendar-event-popover"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { useTRPC } from "@/lib/trpc/context"
import { useQuery } from "@tanstack/react-query"

export function CalendarView() {
  const trpc = useTRPC()
  const [month, setMonth] = React.useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  // Fetch events for the current month
  const { data } = useQuery(
    trpc.calendar.getMonthEvents.queryOptions({
      year: month.getFullYear(),
      month: month.getMonth() + 1,
    }),
    {
      placeholderData: (previousData) => previousData,
    }
  )

  // Helper to get events for a specific date
  const getEventsForDate = React.useCallback(
    (date: Date): { sureCount: number; durusmaCount: number; events: CalendarEvent[] } => {
      if (!data?.events) {
        return { sureCount: 0, durusmaCount: 0, events: [] }
      }

      const dateStr = format(date, "yyyy-MM-dd")
      const dayEvents = data.events.filter((event) => event.tarih === dateStr)

      return {
        sureCount: dayEvents.filter((e) => e.type === "süre").length,
        durusmaCount: dayEvents.filter((e) => e.type === "duruşma").length,
        events: dayEvents,
      }
    },
    [data]
  )

  // Handle day click - D-05: silent ignore for empty days
  const handleDayClick = (date: Date) => {
    const { events } = getEventsForDate(date)
    if (events.length === 0) {
      setPopoverOpen(false)
      return
    }
    setSelectedDate(date)
    setPopoverOpen(true)
  }

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate).events : []

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div className="w-full">
          <Calendar
            month={month}
            onMonthChange={setMonth}
            locale={tr}
            startWeekOn={1}
            captionLayout="dropdown"
            showOutsideDays
            components={{
              DayButton: (props) => (
                <CalendarDayCell
                  {...props}
                  locale={tr}
                  events={getEventsForDate(props.day.date)}
                  onClick={() => handleDayClick(props.day.date)}
                />
              ),
            }}
          />
        </div>
      </PopoverTrigger>
      {selectedDate && selectedDateEvents.length > 0 && (
        <CalendarEventPopover
          events={selectedDateEvents}
          selectedDate={selectedDate}
        />
      )}
    </Popover>
  )
}
