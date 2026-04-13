'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { DegiskenDropdown } from './degisken-dropdown'

type Props = {
  content: string
  onChange: (html: string) => void
  customVariables?: string[]
}

export function SablonEditor({ content, onChange, customVariables = [] }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Dilekçe içeriğini girin...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'min-h-[300px] p-4 border rounded-md prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="space-y-2">
      <DegiskenDropdown editor={editor} customVariables={customVariables} />
      <EditorContent editor={editor} />
    </div>
  )
}