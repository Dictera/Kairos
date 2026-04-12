"use client"

import * as React from "react"
import { type DayButton, type Locale } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

type CalendarDayCellProps = React.ComponentProps<typeof DayButton> & {
  locale?: Partial<Locale>
  events: {
    sureCount: number
    durusmaCount: number
  }
}

export function CalendarDayCell({
  className,
  day,
  modifiers,
  locale,
  events,
  ...props
}: CalendarDayCellProps) {
  const defaultClassNames = {
    ...buttonVariants({ variant: "ghost" }),
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center justify-center gap-0.5 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <span>{day.date.getDate()}</span>
      {events.sureCount > 0 && (
        <span className="text-[9px] leading-none text-red-500 font-medium">
          {events.sureCount} süre
        </span>
      )}
      {events.durusmaCount > 0 && (
        <span className="text-[9px] leading-none text-blue-500 font-medium">
          {events.durusmaCount} duruşma
        </span>
      )}
    </Button>
  )
}
