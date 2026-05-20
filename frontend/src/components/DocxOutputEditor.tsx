'use client'

import { useEffect, useRef, useState } from 'react'

type DocxOutputEditorProps = {
  outputPath?: string
}

export default function DocxOutputEditor({ outputPath }: DocxOutputEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''
    if (!outputPath) return
    const docxPath = outputPath

    let cancelled = false

    async function renderDocx() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/cv/download?path=${encodeURIComponent(docxPath)}`)
        if (!response.ok) throw new Error('Không tải được file DOCX.')

        const blob = await response.blob()
        const { renderAsync } = await import('docx-preview')

        if (cancelled || !containerRef.current) return

        containerRef.current.innerHTML = ''
        await renderAsync(blob, containerRef.current, undefined, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: true,
        })

        const editableRoot = containerRef.current.querySelector('.docx-wrapper') as HTMLElement | null
        const target = editableRoot ?? containerRef.current
        target.contentEditable = 'true'
        target.spellcheck = false
        target.setAttribute('aria-label', 'Chỉnh sửa CV trực tiếp')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không render được file DOCX.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    renderDocx()

    return () => {
      cancelled = true
    }
  }, [outputPath])

  return (
    <div data-cv-docx-editor="true" className="docx-output-editor min-h-[960px] overflow-auto rounded-xl bg-slate-200 p-4">
      {!outputPath && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Chưa có file CV để hiển thị.
        </div>
      )}
      {loading && (
        <div className="flex min-h-[720px] items-center justify-center rounded-lg bg-white text-sm text-gray-500">
          Đang hiển thị file CV...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div ref={containerRef} className={loading || error ? 'hidden' : 'docx-render-host outline-none'} />
    </div>
  )
}
