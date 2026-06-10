'use client'

import { parseISO, format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export function DatePickerField({
  value,
  onChange,
  placeholder,
  id,
  'aria-label': ariaLabel,
}: {
  value: string | null | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  id?: string
  'aria-label'?: string
}) {
  const date = value ? parseISO(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          aria-label={ariaLabel}
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {date ? format(date, 'dd.MM.yyyy', { locale: tr }) : placeholder ?? 'Tarih seçin'}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : undefined)}
          locale={tr}
          weekStartsOn={1}
          captionLayout="label"
        />
      </PopoverContent>
    </Popover>
  )
}
