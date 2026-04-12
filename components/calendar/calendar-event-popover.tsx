"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { tr } from "date-fns/locale/tr"

import {
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

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

type CalendarEventPopoverProps = {
  events: CalendarEvent[]
  selectedDate: Date
}

export function CalendarEventPopover({
  events,
  selectedDate,
}: CalendarEventPopoverProps) {
  // D-04: Sort - süre first, then duruşma, chronological within type
  const sortedEvents = [...events].sort((a, b) => {
    const dateCompare = a.tarih.localeCompare(b.tarih)
    if (dateCompare !== 0) return dateCompare
    return a.type === "süre" ? -1 : 1
  })

  const formattedDate = format(selectedDate, "dd.MM.yyyy", { locale: tr })

  return (
    <PopoverContent className="w-80">
      <PopoverHeader>
        <PopoverTitle>{formattedDate}</PopoverTitle>
        <PopoverDescription>
          {events.length} etkinlik
        </PopoverDescription>
      </PopoverHeader>

      <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
        {sortedEvents.map((event) => (
          <Link
            key={`${event.type}-${event.id}`}
            href={`/dosyalar/${event.dosya_id}`}
            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted transition-colors"
          >
            <Badge
              variant={event.type === "süre" ? "destructive" : "secondary"}
              className="shrink-0"
            >
              {event.type === "süre" ? "Süre" : "Duruşma"}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.ad}</p>
              <p className="text-xs text-muted-foreground">
                {event.muvekkil_ad} — #{event.dosya_no}
                {event.type === "duruşma" && event.saati && ` • ${event.saati}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PopoverContent>
  )
}
