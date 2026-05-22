'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export default function HtmlOutputEditor({ outputPath }: { outputPath?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  const url = useMemo(() => {
    if (!outputPath) return ''
    return `/api/cv/download?path=${encodeURIComponent(outputPath)}`
  }, [outputPath])

  useEffect(() => {
    if (!url) return
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error('Không tải được HTML output')
        setHtml(await res.text())
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được HTML output'))
  }, [url])

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !html) return
    doc.open()
    doc.write(html.replace('<main class="page">', '<main class="page" contenteditable="true">'))
    doc.close()
  }, [html])

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <iframe
        ref={iframeRef}
        title="HTML CV editor"
        className="h-215 w-full rounded-lg border border-slate-200 bg-slate-100"
      />
    </div>
  )
}
