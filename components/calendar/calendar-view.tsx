"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, addDays } from "date-fns"
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
import { getDaysUntil, isInAdliTatil } from "@/lib/deadline-service"

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

type ActiveFilter = "all" | "süre" | "duruşma"

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

/**
 * Returns a Tailwind background class for a süre dot based on urgency.
 * Only applies to "süre" type events; duruşma events use blue always.
 */
function getSureDotClass(daysUntil: number): string {
  if (daysUntil < 0) return "bg-red-800"   // overdue
  if (daysUntil <= 3) return "bg-red-500"   // 0–3 days
  if (daysUntil <= 7) return "bg-orange-500" // 4–7 days
  if (daysUntil <= 30) return "bg-amber-400" // 8–30 days
  return "bg-green-500"                       // 31+ days
}

/**
 * Returns the dot class for any event (süre uses urgency tiers, duruşma uses blue).
 */
function getEventDotClass(event: CalendarEvent): string {
  if (event.type === "duruşma") return "bg-blue-500"
  return getSureDotClass(getDaysUntil(event.tarih))
}

export function CalendarView() {
  const trpc = useTRPC()
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>("all")

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Monday-first offset: how many empty cells to prepend before day 1
  // getDay() returns 0=Sun, 1=Mon, ..., 6=Sat
  // Convert to Monday-first: Mon=0, Tue=1, ..., Sun=6
  const startOffset = (getDay(monthStart) + 6) % 7

  const { data } = useQuery({
    ...trpc.calendar.getMonthEvents.queryOptions({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
    }),
    placeholderData: (previousData) => previousData,
  })

  // Filter events by active chip (only for grid display)
  const filteredEvents = React.useMemo(() => {
    if (!data?.events) return []
    if (activeFilter === "all") return data.events
    return data.events.filter((e) => e.type === activeFilter)
  }, [data, activeFilter])

  const eventsMap = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of filteredEvents) {
      const existing = map.get(event.tarih) || []
      existing.push(event)
      map.set(event.tarih, existing)
    }
    return map
  }, [filteredEvents])

  // Upcoming 7-day panel — always reads raw data regardless of active filter
  const upcomingEvents = React.useMemo(() => {
    if (!data?.events) return []
    const today = new Date()
    const todayStr = format(today, "yyyy-MM-dd")
    const endStr = format(addDays(today, 7), "yyyy-MM-dd")
    return data.events
      .filter((e) => e.tarih >= todayStr && e.tarih <= endStr)
      .sort((a, b) => {
        if (a.tarih !== b.tarih) return a.tarih.localeCompare(b.tarih)
        // sort by time within same day
        const aTime = a.saat ?? "00:00"
        const bTime = b.saat ?? "00:00"
        return aTime.localeCompare(bTime)
      })
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
    <div className="flex h-full gap-4 min-h-0">
      {/* Left: Main calendar */}
      <div className="flex flex-col flex-1 min-w-0 gap-2">
        {/* Header with month navigation */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="size-8" onClick={handlePrevMonth}>
              <ChevronLeftIcon className="size-3.5" />
            </Button>

            <div className="flex items-center gap-1.5">
              <Select value={String(currentMonth.getMonth())} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[100px] h-8 text-sm">
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
                <SelectTrigger className="w-[90px] h-8 text-sm">
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

            <Button variant="outline" size="icon" className="size-8" onClick={handleNextMonth}>
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCurrentMonth(new Date())}
            >
              Bugün
            </Button>

            {/* Filter chips */}
            <div className="flex items-center gap-1">
              {(["all", "süre", "duruşma"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter === "all" ? "Tümü" : filter === "süre" ? "Süreler" : "Duruşmalar"}
                </Button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
        <div className="grid grid-cols-7 gap-1 shrink-0">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 gap-1 auto-rows-fr min-h-0">
          {/* Leading empty cells to align day 1 with the correct weekday */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}

          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const dayEvents = eventsMap.get(dateStr) || []
            const hasEvents = dayEvents.length > 0
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const adliTatil = isInAdliTatil(dateStr)

            const singleEventLabel = dayEvents.length === 1
              ? (dayEvents[0].type === "duruşma" && dayEvents[0].saat
                  ? `${dayEvents[0].saat} ${dayEvents[0].ad}`
                  : dayEvents[0].ad)
              : null

            return (
              <Popover key={dateStr} open={!!(isSelected && popoverOpen)} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "relative flex flex-col items-center justify-start p-1.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-left h-full",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground",
                      isToday(day) && "border-primary border-2",
                      isSelected && "bg-muted ring-2 ring-primary ring-offset-1",
                      adliTatil && "bg-yellow-50/40"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={cn(
                          "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          isToday(day) && "bg-primary text-primary-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {adliTatil && (
                        <span className="text-[8px] font-semibold text-amber-700 leading-none">
                          AT
                        </span>
                      )}
                    </div>

                    {hasEvents && (
                      <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <span
                            key={`${event.type}-${event.id}-${idx}`}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              getEventDotClass(event)
                            )}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {dayEvents.length > 0 && (
                      <div className="mt-auto pt-0.5 w-full">
                        <span className="text-[9px] text-muted-foreground truncate block leading-tight">
                          {singleEventLabel ?? `${dayEvents.length} etkinlik`}
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
                              getEventDotClass(event)
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

      {/* Right: Upcoming 7-day panel */}
      <div className="w-52 shrink-0 flex flex-col min-h-0 border-l border-border pl-4">
        <h3 className="text-sm font-semibold mb-2 shrink-0">Yaklaşan 7 Gün</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Önümüzdeki 7 günde etkinlik yok</p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {upcomingEvents.map((event) => (
              <Link
                key={`upcoming-${event.type}-${event.id}`}
                href={`/dosyalar/${event.dosya_id}`}
                className="flex flex-col gap-0.5 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", getEventDotClass(event))}
                  />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(event.tarih + "T12:00:00"), "dd MMM", { locale: tr })}
                    {event.saat ? ` ${event.saat}` : ""}
                  </span>
                </div>
                <span className="text-xs font-medium truncate pl-3">{event.ad}</span>
                <span className="text-[10px] text-muted-foreground truncate pl-3">
                  {event.muvekkil_ad}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
