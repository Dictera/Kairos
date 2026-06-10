'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChangelogSectionProps {
  content: string
}

function Inline({ text }: { text: string }): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  const seen = new Map<string, number>()
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const n = seen.get(part) ?? 0
      seen.set(part, n + 1)
      return <strong key={`${part}#${n}`}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function ChangelogSection({ content }: ChangelogSectionProps) {
  const lines = content.split('\n')

  const seen = new Map<string, number>()
  const keyFor = (line: string) => {
    const n = seen.get(line) ?? 0
    seen.set(line, n + 1)
    return `${line}#${n}`
  }

  const rendered = lines.map((line) => {
    const key = keyFor(line)
    if (line.startsWith('## ')) {
      return (
        <h2
          key={key}
          className="font-semibold text-base border-b pb-1 mb-2 mt-4 first:mt-0"
        >
          <Inline text={line.replace(/^## /, '')} />
        </h2>
      )
    }
    if (line.startsWith('### ')) {
      return (
        <h3
          key={key}
          className="font-medium text-sm text-muted-foreground mt-3 mb-1"
        >
          <Inline text={line.replace(/^### /, '')} />
        </h3>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <ul key={key} className="list-disc list-inside">
          <li className="text-sm"><Inline text={line.replace(/^[-*] /, '')} /></li>
        </ul>
      )
    }
    if (line.trim() === '') {
      return <div key={key} className="h-1" />
    }
    return (
      <p key={key} className="text-sm">
        <Inline text={line} />
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
