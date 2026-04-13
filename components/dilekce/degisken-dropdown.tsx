'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Editor } from '@tiptap/react'
import { ChevronDown } from 'lucide-react'

const PREDEFINED_VARIABLES = [
  'müvekkil_adı', 'müvekkil_soyadı', 'dosya_no', 'dava_no', 'stk_no',
  'mahkeme', 'durusma_tarihi', 'talep_tutari', 'sigorta_şirketi', 'karsitaraf',
  'karsitaraf_vekil', 'police_no', 'basvuru_tarihi', 'karar_tarihi', 'tebligat_tarihi',
]

type Props = {
  editor: Editor
  customVariables?: string[]
}

export function DegiskenDropdown({ editor, customVariables = [] }: Props) {
  const allVariables = [...PREDEFINED_VARIABLES, ...customVariables]

  const insertVariable = (varName: string) => {
    editor.chain().focus().insertContent(`{{${varName}}}`).run()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ChevronDown className="h-4 w-4 mr-1" />
          Değişken Ekle
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        {allVariables.map((v) => (
          <DropdownMenuItem key={v} onSelect={() => insertVariable(v)}>
            <code className="text-sm bg-muted px-1 py-0.5 rounded">{{{v}}}</code>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}