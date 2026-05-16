'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const value = `{{ ${text} }}`
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      toast.success(`Kopyalandı: ${value}`)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => toast.error('Kopyalanamadı.'))
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      aria-label={`${text} kopyala`}
    >
      <Copy className={`h-3.5 w-3.5 shrink-0 transition-colors ${copied ? 'text-green-600' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`} />
    </button>
  )
}

export function CopyExampleButton({ example, className }: { example: string; className?: string }) {
  function handleCopy() {
    navigator.clipboard.writeText(example).then(() => {
      toast.success(`Kopyalandı: ${example}`)
    }).catch(() => toast.error('Kopyalanamadı.'))
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      aria-label="örnek kopyala"
    >
      <Copy className="h-3.5 w-3.5 shrink-0 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </button>
  )
}
