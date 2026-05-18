'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ClockPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (time: string) => void // "HH:MM" formatında
}

type Step = 'hour' | 'minute'

// Polar coordinate helpers
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

// Angle from SVG click relative to center
function clickAngle(
  e: React.MouseEvent<SVGSVGElement>,
  svgRef: SVGSVGElement
): number {
  const rect = svgRef.getBoundingClientRect()
  const svgSize = rect.width // viewBox is 200x200, actual size may differ
  const scale = 200 / svgSize
  const cx = (e.clientX - rect.left) * scale
  const cy = (e.clientY - rect.top) * scale
  // Angle from center (100,100), 0 at top
  const dx = cx - 100
  const dy = cy - 100
  let angle = Math.atan2(dy, dx) // -PI to PI, 0 = right
  // Normalize to 0..2PI starting from top (12 o'clock)
  angle = angle + Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI
  return angle
}

export function ClockPicker({ open, onOpenChange, onConfirm }: ClockPickerProps) {
  const [hour, setHour] = useState(12)
  const [minute, setMinute] = useState(0)
  const [step, setStep] = useState<Step>('hour')

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHour(12)
      setMinute(0)
      setStep('hour')
    }
  }, [open])

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget
    const angle = clickAngle(e, svg)

    if (step === 'hour') {
      // Map angle (0..2PI) to hour (1..12)
      let h = Math.round((angle / (2 * Math.PI)) * 12)
      if (h === 0) h = 12
      setHour(h)
      setStep('minute')
    } else {
      // Map angle (0..2PI) to minute (0,5,10,...,55)
      const m = Math.round((angle / (2 * Math.PI)) * 12) * 5 % 60
      setMinute(m)
    }
  }

  function handleConfirm() {
    onConfirm(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    onOpenChange(false)
    // State reset happens via useEffect on open=false
  }

  const CX = 100
  const CY = 100
  const R_FACE = 90
  const R_NUMBERS = 72
  const R_HAND_HOUR = 50
  const R_HAND_MIN = 65
  const R_MIN_DOTS = 72

  // Render hour numbers (1–12)
  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1
    const angle = (num / 12) * 2 * Math.PI - Math.PI / 2
    const pos = polarToCartesian(CX, CY, R_NUMBERS, angle)
    const isSelected = step === 'hour' && hour === num
    return { num, pos, isSelected, angle }
  })

  // Render minute marks (0, 5, 10, ..., 55) — 12 marks
  const minuteMarks = Array.from({ length: 12 }, (_, i) => {
    const min = i * 5
    const angle = (min / 60) * 2 * Math.PI - Math.PI / 2
    const pos = polarToCartesian(CX, CY, R_MIN_DOTS, angle)
    const isSelected = step === 'minute' && minute === min
    return { min, pos, isSelected, angle }
  })

  // Clock hand angle
  const hourAngle =
    step === 'hour'
      ? (hour / 12) * 2 * Math.PI - Math.PI / 2
      : (hour / 12) * 2 * Math.PI - Math.PI / 2

  const minuteAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2

  const hourHandEnd = polarToCartesian(CX, CY, R_HAND_HOUR, hourAngle)
  const minuteHandEnd = polarToCartesian(CX, CY, R_HAND_MIN, minuteAngle)

  const displayHour = String(hour).padStart(2, '0')
  const displayMinute = String(minute).padStart(2, '0')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Saat Seç</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'hour' ? 'Saati seçin' : 'Dakikayı seçin'}
          </p>
        </DialogHeader>

        {/* Selected time display */}
        <div className="flex justify-center py-1">
          <span className="text-4xl font-semibold tabular-nums tracking-tight">
            <span
              className={
                step === 'hour'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }
              onClick={() => setStep('hour')}
              style={{ cursor: 'pointer' }}
            >
              {displayHour}
            </span>
            <span className="text-muted-foreground">:</span>
            <span
              className={
                step === 'minute'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }
              onClick={() => setStep('minute')}
              style={{ cursor: 'pointer' }}
            >
              {displayMinute}
            </span>
          </span>
        </div>

        {/* SVG clock face */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 200 200"
            width="220"
            height="220"
            className="cursor-pointer select-none"
            onClick={handleSvgClick}
            aria-label="Saat kadranı"
          >
            {/* Outer circle */}
            <circle
              cx={CX}
              cy={CY}
              r={R_FACE}
              className="fill-muted stroke-border"
              strokeWidth="1"
            />

            {step === 'hour' ? (
              <>
                {/* Hour hand */}
                <line
                  x1={CX}
                  y1={CY}
                  x2={hourHandEnd.x}
                  y2={hourHandEnd.y}
                  className="stroke-foreground"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Hour numbers */}
                {hourNumbers.map(({ num, pos, isSelected }) => (
                  <g key={num}>
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="14"
                        className="fill-accent"
                      />
                    )}
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="13"
                      fontWeight={isSelected ? '600' : '400'}
                      className={
                        isSelected
                          ? 'fill-accent-foreground'
                          : 'fill-foreground'
                      }
                    >
                      {num}
                    </text>
                  </g>
                ))}
              </>
            ) : (
              <>
                {/* Minute hand */}
                <line
                  x1={CX}
                  y1={CY}
                  x2={minuteHandEnd.x}
                  y2={minuteHandEnd.y}
                  className="stroke-foreground"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Minute marks */}
                {minuteMarks.map(({ min, pos, isSelected }) => (
                  <g key={min}>
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="14"
                        className="fill-accent"
                      />
                    )}
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="12"
                      fontWeight={isSelected ? '600' : '400'}
                      className={
                        isSelected
                          ? 'fill-accent-foreground'
                          : 'fill-foreground'
                      }
                    >
                      {String(min).padStart(2, '0')}
                    </text>
                  </g>
                ))}
              </>
            )}

            {/* Center dot */}
            <circle cx={CX} cy={CY} r="3" className="fill-foreground" />
          </svg>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              İptal
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} type="button">
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
