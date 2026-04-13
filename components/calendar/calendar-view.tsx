"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns"
import { tr } from "date-fns/locale/tr"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTRPC } from "@/lib/trpc/context"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

export type CalendarEvent = {
  id: number
  type: "süre" | "duruşma"
  ad: string
  dosya_id: number
  dosya_no: string
  muvekkil_ad: string
  tarih: string
  saat: string | null
}

const months = [
  { value: "0", label: "Ocak" },
  { value: "1", label: "Şubat" },
  { value: "2", label: "Mart" },
  { value: "3", label: "Nisan" },
  { value: "4", label: "Mayıs" },
  { value: "5", label: "Haziran" },
  { value: "6", label: "Temmuz" },
  { value: "7", label: "Ağustos" },
  { value: "8", label: "Eylül" },
  { value: "9", label: "Ekim" },
  { value: "10", label: "Kasım" },
  { value: "11", label: "Aralık" },
]

const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

export function CalendarView() {
  const trpc = useTRPC()
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const { data } = useQuery({
    ...trpc.calendar.getMonthEvents.queryOptions({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
    }),
    placeholderData: (previousData) => previousData,
  })

  const eventsMap = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    if (!data?.events) return map

    for (const event of data.events) {
      const existing = map.get(event.tarih) || []
      existing.push(event)
      map.set(event.tarih, existing)
    }
    return map
  }, [data])

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleMonthChange = (month: string) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(month)))
  }

  const handleYearChange = (year: string) => {
    setCurrentMonth(new Date(parseInt(year), currentMonth.getMonth()))
  }

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const dayEvents = eventsMap.get(dateStr) || []

    if (dayEvents.length === 0) {
      setPopoverOpen(false)
      setSelectedDate(null)
      return
    }

    setSelectedDate(date)
    setPopoverOpen(true)
  }

  const selectedDateEvents = selectedDate
    ? eventsMap.get(format(selectedDate, "yyyy-MM-dd")) || []
    : []

  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeftIcon className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Select value={String(currentMonth.getMonth())} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(currentMonth.getFullYear())} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Bugün
          </Button>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Süre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Duruşma
            </span>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-1 auto-rows-fr">
        {daysInMonth.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const dayEvents = eventsMap.get(dateStr) || []
          const hasEvents = dayEvents.length > 0
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <Popover key={dateStr} open={!!(isSelected && popoverOpen)} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative flex flex-col items-center justify-start p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-left h-full",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground",
                    isToday(day) && "border-primary border-2",
                    isSelected && "bg-muted ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {hasEvents && (
                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <span
                          key={`${event.type}-${event.id}-${idx}`}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            event.type === "süre" ? "bg-red-500" : "bg-blue-500"
                          )}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {dayEvents.length > 0 && (
                    <div className="mt-auto pt-1 w-full">
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {dayEvents.length} etkinlik
                      </span>
                    </div>
                  )}
                </button>
              </PopoverTrigger>

              {hasEvents && (
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b border-border">
                    <p className="font-semibold">{format(day, "dd MMMM yyyy", { locale: tr })}</p>
                    <p className="text-sm text-muted-foreground">
                      {dayEvents.length} etkinlik
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {dayEvents.map((event) => (
                      <Link
                        key={`${event.type}-${event.id}`}
                        href={`/dosyalar/${event.dosya_id}`}
                        onClick={() => setPopoverOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            event.type === "süre" ? "bg-red-500" : "bg-blue-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.ad}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.muvekkil_ad} — #{event.dosya_no}
                            {event.type === "duruşma" && event.saat && ` • ${event.saat}`}
                          </p>
                        </div>
                        <Badge
                          variant={event.type === "süre" ? "destructive" : "secondary"}
                          className="shrink-0 text-xs"
                        >
                          {event.type === "süre" ? "Süre" : "Duruşma"}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          )
        })}
      </div>
    </div>
  )
}
