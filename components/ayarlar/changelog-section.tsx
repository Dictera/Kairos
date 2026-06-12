'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChangelogSectionProps {
  content: string
}

function Inline({ text }: { text: string }): React.ReactNode {
  // Tokenize bold (**x**) and markdown links ([text](url)).
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  const seen = new Map<string, number>()
  return parts.map((part) => {
    const n = seen.get(part) ?? 0
    seen.set(part, n + 1)
    const key = `${part}#${n}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {link[1]}
        </a>
      )
    }
    return part
  })
}

export function ChangelogSection({ content }: ChangelogSectionProps) {
  const allLines = content.split('\n')
  // Drop the leading boilerplate (H1 title + intro + format note) and the
  // link-reference definitions at the bottom (`[x]: https://...`).
  const firstSection = allLines.findIndex((l) => l.startsWith('## '))
  const lines = (firstSection === -1 ? allLines : allLines.slice(firstSection))
    .filter((l) => !/^\[[^\]]+\]:\s/.test(l))

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
          <Inline text={line.replace(/^## /, '').replace(/\[([^\]]+)\]/g, '$1')} />
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
