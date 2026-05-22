'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Props = { outputPath?: string }

// Pre-warm the import so it's ready before the user clicks
let _docxPreview: Promise<typeof import('docx-preview')> | null = null
function getDocxPreview() {
  if (!_docxPreview) _docxPreview = import('docx-preview')
  return _docxPreview
}

function Sep() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-gray-300" />
}

function Btn({
  onMouseDown,
  active,
  title,
  children,
}: {
  onMouseDown: (e: React.MouseEvent) => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`flex min-w-7 items-center justify-center rounded px-1.5 py-1 text-sm transition-colors hover:bg-gray-200 active:bg-gray-300 ${
        active ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

const FONT_SIZES = [
  { label: '8pt', value: '1' },
  { label: '10pt', value: '2' },
  { label: '12pt', value: '3' },
  { label: '14pt', value: '4' },
  { label: '18pt', value: '5' },
  { label: '24pt', value: '6' },
  { label: '36pt', value: '7' },
]

export default function DocxOutputEditor({ outputPath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editableRef = useRef<HTMLElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fmt, setFmt] = useState({
    bold: false, italic: false, underline: false, strike: false,
    left: false, center: false, right: false, justify: false,
  })

  // Pre-warm docx-preview bundle on mount
  useEffect(() => { getDocxPreview() }, [])

  const updateFmt = useCallback(() => {
    try {
      setFmt({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        left: document.queryCommandState('justifyLeft'),
        center: document.queryCommandState('justifyCenter'),
        right: document.queryCommandState('justifyRight'),
        justify: document.queryCommandState('justifyFull'),
      })
    } catch {}
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''
    if (!outputPath) return
    let cancelled = false

    async function renderDocx() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/cv/download?path=${encodeURIComponent(outputPath!)}`)
        if (!response.ok) throw new Error('Không tải được file DOCX.')
        const blob = await response.blob()
        const { renderAsync } = await getDocxPreview()
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = ''
        await renderAsync(blob, containerRef.current, undefined, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: false,
        })
        const editableRoot = containerRef.current.querySelector('.docx-wrapper') as HTMLElement | null
        const target = editableRoot ?? containerRef.current
        target.contentEditable = 'true'
        target.spellcheck = false
        editableRef.current = target
        target.addEventListener('keyup', updateFmt)
        target.addEventListener('mouseup', updateFmt)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Không render được file DOCX.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    renderDocx()
    return () => { cancelled = true }
  }, [outputPath, updateFmt])

  const exec = useCallback((e: React.MouseEvent, cmd: string, value?: string) => {
    e.preventDefault()
    editableRef.current?.focus()
    document.execCommand(cmd, false, value)
    updateFmt()
  }, [updateFmt])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">

        {/* Undo / Redo */}
        <Btn title="Hoàn tác (Ctrl+Z)" onMouseDown={(e) => exec(e, 'undo')}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </Btn>
        <Btn title="Làm lại (Ctrl+Y)" onMouseDown={(e) => exec(e, 'redo')}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </Btn>

        <Sep />

        {/* Bold / Italic / Underline / Strike */}
        <Btn title="In đậm (Ctrl+B)" active={fmt.bold} onMouseDown={(e) => exec(e, 'bold')}>
          <span className="font-bold">B</span>
        </Btn>
        <Btn title="In nghiêng (Ctrl+I)" active={fmt.italic} onMouseDown={(e) => exec(e, 'italic')}>
          <em className="font-serif">I</em>
        </Btn>
        <Btn title="Gạch chân (Ctrl+U)" active={fmt.underline} onMouseDown={(e) => exec(e, 'underline')}>
          <span className="underline">U</span>
        </Btn>
        <Btn title="Gạch ngang" active={fmt.strike} onMouseDown={(e) => exec(e, 'strikeThrough')}>
          <span className="line-through">S</span>
        </Btn>

        <Sep />

        {/* Font size */}
        <select
          title="Cỡ chữ"
          defaultValue="3"
          className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            editableRef.current?.focus()
            document.execCommand('fontSize', false, e.target.value)
          }}
        >
          {FONT_SIZES.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <Sep />

        {/* Alignment */}
        <Btn title="Căn trái" active={fmt.left} onMouseDown={(e) => exec(e, 'justifyLeft')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <rect x="2" y="3" width="16" height="2" rx="1" />
            <rect x="2" y="7.5" width="10" height="2" rx="1" />
            <rect x="2" y="12" width="16" height="2" rx="1" />
            <rect x="2" y="16.5" width="10" height="2" rx="1" />
          </svg>
        </Btn>
        <Btn title="Căn giữa" active={fmt.center} onMouseDown={(e) => exec(e, 'justifyCenter')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <rect x="2" y="3" width="16" height="2" rx="1" />
            <rect x="5" y="7.5" width="10" height="2" rx="1" />
            <rect x="2" y="12" width="16" height="2" rx="1" />
            <rect x="5" y="16.5" width="10" height="2" rx="1" />
          </svg>
        </Btn>
        <Btn title="Căn phải" active={fmt.right} onMouseDown={(e) => exec(e, 'justifyRight')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <rect x="2" y="3" width="16" height="2" rx="1" />
            <rect x="8" y="7.5" width="10" height="2" rx="1" />
            <rect x="2" y="12" width="16" height="2" rx="1" />
            <rect x="8" y="16.5" width="10" height="2" rx="1" />
          </svg>
        </Btn>
        <Btn title="Căn đều 2 bên" active={fmt.justify} onMouseDown={(e) => exec(e, 'justifyFull')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <rect x="2" y="3" width="16" height="2" rx="1" />
            <rect x="2" y="7.5" width="16" height="2" rx="1" />
            <rect x="2" y="12" width="16" height="2" rx="1" />
            <rect x="2" y="16.5" width="16" height="2" rx="1" />
          </svg>
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn title="Danh sách bullet" onMouseDown={(e) => exec(e, 'insertUnorderedList')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <circle cx="3.5" cy="5" r="1.5" />
            <rect x="7" y="4" width="11" height="2" rx="1" />
            <circle cx="3.5" cy="10" r="1.5" />
            <rect x="7" y="9" width="11" height="2" rx="1" />
            <circle cx="3.5" cy="15" r="1.5" />
            <rect x="7" y="14" width="11" height="2" rx="1" />
          </svg>
        </Btn>
        <Btn title="Danh sách số" onMouseDown={(e) => exec(e, 'insertOrderedList')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <text x="1" y="7" fontSize="6" fontFamily="monospace">1.</text>
            <rect x="7" y="4" width="11" height="2" rx="1" />
            <text x="1" y="12" fontSize="6" fontFamily="monospace">2.</text>
            <rect x="7" y="9" width="11" height="2" rx="1" />
            <text x="1" y="17" fontSize="6" fontFamily="monospace">3.</text>
            <rect x="7" y="14" width="11" height="2" rx="1" />
          </svg>
        </Btn>

        <Sep />

        {/* Indent / Outdent */}
        <Btn title="Thụt lề vào" onMouseDown={(e) => exec(e, 'indent')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" d="M2 4h16M2 8.5h9M2 13h16M2 17.5h9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 7.5l3 2-3 2" />
          </svg>
        </Btn>
        <Btn title="Thụt lề ra" onMouseDown={(e) => exec(e, 'outdent')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" d="M2 4h16M9 8.5h9M2 13h16M9 17.5h9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5L3 9.5l3 2" />
          </svg>
        </Btn>

        <Sep />

        {/* Remove formatting */}
        <Btn title="Xoá định dạng" onMouseDown={(e) => exec(e, 'removeFormat')}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l14 14M9 4h8l-3.5 5.5M5 15l3.5-4" />
          </svg>
        </Btn>
      </div>

      {/* ── Content ── */}
      <div className="min-h-240 overflow-auto bg-slate-200 p-4">
        {!outputPath && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Chưa có file CV để hiển thị.
          </div>
        )}
        {loading && (
          <div className="flex min-h-180 items-center justify-center rounded-lg bg-white text-sm text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
              Đang hiển thị file CV...
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div
          ref={containerRef}
          data-cv-docx-editor="true"
          className={loading || error ? 'hidden' : 'docx-render-host outline-none'}
        />
      </div>
    </div>
  )
}
