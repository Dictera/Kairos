'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChangelogSectionProps {
  content: string
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function ChangelogSection({ content }: ChangelogSectionProps) {
  const lines = content.split('\n')

  const rendered = lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h2
          key={i}
          className="font-semibold text-base border-b pb-1 mb-2 mt-4 first:mt-0"
        >
          {renderInline(line.replace(/^## /, ''))}
        </h2>
      )
    }
    if (line.startsWith('### ')) {
      return (
        <h3
          key={i}
          className="font-medium text-sm text-muted-foreground mt-3 mb-1"
        >
          {renderInline(line.replace(/^### /, ''))}
        </h3>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <ul key={i} className="list-disc list-inside">
          <li className="text-sm">{renderInline(line.replace(/^[-*] /, ''))}</li>
        </ul>
      )
    }
    if (line.trim() === '') {
      return <div key={i} className="h-1" />
    }
    return (
      <p key={i} className="text-sm">
        {renderInline(line)}
      </p>
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Changelog</CardTitle>
        <CardDescription>Uygulama sürüm geçmişi ve değişiklik kayıtları.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-0.5">{rendered}</div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
