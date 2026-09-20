'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Free TinyMCE via jsDelivr (no API key).
 * Alternative: set NEXT_PUBLIC_TINYMCE_API_KEY for Tiny Cloud.
 */
export default function TinyMCEEditor({
  value,
  onChange,
  height = 420,
}: {
  value: string
  onChange: (html: string) => void
  height?: number
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorId = useRef(`editor-${Math.random().toString(36).slice(2, 9)}`).current
  const [ready, setReady] = useState(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let cancelled = false

    async function load() {
      const w = window as any
      if (!w.tinymce) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          // Community build – no API key required
          s.src = 'https://cdn.jsdelivr.net/npm/tinymce@6.8.5/tinymce.min.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load TinyMCE'))
          document.head.appendChild(s)
        })
      }
      if (cancelled) return

      const tinymce = (window as any).tinymce
      tinymce.init({
        selector: `#${editorId}`,
        height,
        menubar: 'file edit view insert format tools',
        plugins:
          'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
        toolbar:
          'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat code fullscreen',
        branding: false,
        promotion: false,
        convert_urls: false,
        content_style:
          'body { font-family: Inter, system-ui, sans-serif; font-size: 15px; line-height: 1.6; }',
        setup(editor: any) {
          editor.on('init', () => {
            if (value) editor.setContent(value)
            setReady(true)
          })
          editor.on('change keyup undo redo', () => {
            onChangeRef.current(editor.getContent())
          })
        },
      })
    }

    load().catch(console.error)

    return () => {
      cancelled = true
      const tinymce = (window as any).tinymce
      if (tinymce) {
        const ed = tinymce.get(editorId)
        if (ed) ed.remove()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorId, height])

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {!ready && (
        <p className="text-xs text-slate-400 px-3 py-2 border-b">Loading editor…</p>
      )}
      <textarea
        id={editorId}
        ref={textareaRef}
        defaultValue={value}
        className="w-full min-h-[200px] p-3 text-sm"
      />
    </div>
  )
}
