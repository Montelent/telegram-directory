'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    tinymce?: any
  }
}

export default function TinyMCEEditor({
  value,
  onChange,
  height = 400,
}: {
  value: string
  onChange: (html: string) => void
  height?: number
}) {
  const idRef = useRef(`tinymce-${Math.random().toString(36).slice(2)}`)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const id = idRef.current

    function init() {
      if (!window.tinymce) return
      window.tinymce.init({
        selector: `#${id}`,
        height,
        menubar: false,
        plugins: 'lists link image code table autolink',
        toolbar:
          'undo redo | styles | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | code',
        content_style: 'body { font-family: Inter, system-ui, sans-serif; font-size: 15px; }',
        setup(editor: any) {
          editor.on('change keyup', () => {
            onChangeRef.current(editor.getContent())
          })
        },
      })
    }

    if (window.tinymce) {
      init()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js'
      script.referrerPolicy = 'origin'
      script.onload = init
      document.body.appendChild(script)
    }

    return () => {
      if (window.tinymce) {
        window.tinymce.get(id)?.remove()
      }
    }
  }, [height])

  return (
    <textarea
      id={idRef.current}
      defaultValue={value}
      className="w-full min-h-[200px] border rounded-lg p-2 text-sm"
    />
  )
}
