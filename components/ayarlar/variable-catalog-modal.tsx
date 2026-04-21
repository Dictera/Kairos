'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { VARIABLE_REGISTRY } from '@/lib/docx/variable-registry'

interface VariableCatalogModalProps {
  sablon: { id: number; ad: string; degiskenler: string[] } | null
  onOpenChange: (open: boolean) => void
}

export function VariableCatalogModal({ sablon, onOpenChange }: VariableCatalogModalProps) {
  const variables = sablon?.degiskenler ?? []
  const sorted = [...variables].sort((a, b) => a.localeCompare(b, 'tr'))

  return (
    <Dialog open={sablon !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sablon?.ad ?? ''} — Değişkenler</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Bu şablonda değişken bulunmuyor.
            </p>
          )}
          {sorted.map((v) => {
            const known = VARIABLE_REGISTRY.find((r) => r.path === v)
            return (
              <div
                key={v}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50"
              >
                <code className="text-sm font-mono">{'{{ '}{v}{' }}'}</code>
                {known ? (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-300"
                  >
                    ✓ Bilinen
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    ⚠ Bilinmeyen
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}