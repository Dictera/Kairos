"use client"

import { CalendarView } from "@/components/calendar/calendar-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TakvimPage() {
  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Takvim</h1>
      </div>
      <Card className="w-full">
        <CardContent className="p-6">
          <CalendarView />
        </CardContent>
      </Card>
    </div>
  )
}
