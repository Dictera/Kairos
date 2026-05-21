"use client"

import { CalendarView } from "@/components/calendar/calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, CalendarDays } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/lib/trpc/context"

export default function TakvimPage() {
  const trpc = useTRPC()
  const { data: exportData } = useQuery(trpc.ayarlar.takvim.getExportGoster.queryOptions())
  const exportGoster = exportData?.goster ?? true

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden px-6 pt-4 pb-4">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-2xl font-semibold">Takvim</h1>
        {exportGoster && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/api/calendar/ics" download="sigorta-takvimi.ics">
                <Download className="size-4 mr-2" />
                Takvimi İndir (.ics)
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`webcal://${typeof window !== "undefined" ? window.location.host : "localhost:3000"}/api/calendar/ics`}>
                <CalendarDays className="size-4 mr-2" />
                Abone Ol (Otomatik Senkronize)
              </a>
            </Button>
          </div>
        )}
      </div>
      <Card className="flex-1 min-h-0">
        <CardContent className="p-4 h-full">
          <CalendarView />
        </CardContent>
      </Card>
    </div>
  )
}
