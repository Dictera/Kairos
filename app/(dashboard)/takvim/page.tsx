"use client"

import { CalendarView } from "@/components/calendar/calendar-view"
import { Card, CardContent } from "@/components/ui/card"

export default function TakvimPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden px-6 pt-4 pb-4">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-2xl font-semibold">Takvim</h1>
      </div>
      <Card className="flex-1 min-h-0">
        <CardContent className="p-4 h-full">
          <CalendarView />
        </CardContent>
      </Card>
    </div>
  )
}
