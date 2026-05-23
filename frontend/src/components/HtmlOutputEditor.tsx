'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type FormatState = {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  ordered: boolean
  unordered: boolean
}

type CvComponentKind = 'awards' | 'projects' | 'activities'

const FONT_FAMILIES = ['Poppins', 'Raleway', 'Lato', 'Inter', 'Open Sans', 'Barlow', 'Arial', 'Georgia', 'Times New Roman']
const DEFAULT_FORMAT: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ordered: false,
  unordered: false,
}

const CV_COMPONENTS = [
  { kind: 'awards' as const, label: 'Giải thưởng', icon: '★' },
  { kind: 'projects' as const, label: 'Dự án', icon: '▣' },
  { kind: 'activities' as const, label: 'Hoạt động', icon: '◉' },
]

const SECTION_COPY: Record<CvComponentKind, { title: string; body: string }> = {
  awards: {
    title: 'Awards',
    body: '<div class="exp-entry"><div class="exp-head"><span class="exp-company">Tên giải thưởng</span><span class="exp-time">YYYY</span></div><div class="exp-role">Đơn vị trao giải</div><ul class="exp-bullets"><li>Mô tả ngắn về thành tích hoặc phạm vi giải thưởng.</li></ul></div>',
  },
  projects: {
    title: 'Projects',
    body: '<div class="exp-entry"><div class="exp-head"><span class="exp-company">Tên dự án</span><span class="exp-time">MM/YYYY - MM/YYYY</span></div><div class="exp-role">Link: https://example.com</div><ul class="exp-bullets"><li>Mô tả mục tiêu, vai trò, công nghệ sử dụng và kết quả dự án.</li></ul></div>',
  },
  activities: {
    title: 'Activities',
    body: '<div class="exp-entry"><div class="exp-head"><span class="exp-company">Tên hoạt động</span><span class="exp-time">MM/YYYY - MM/YYYY</span></div><div class="exp-role">Vai trò / Tổ chức</div><ul class="exp-bullets"><li>Mô tả đóng góp chính hoặc kết quả đạt được.</li></ul></div>',
  },
}

function sectionIcon(kind: CvComponentKind) {
  if (kind === 'projects') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 5V4c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2h4Zm2 0h2V4h-2v1Zm-6 6h14V7H5v4Zm0 2v5h14v-5h-5v1h-4v-1H5Z"/></svg>'
  }
  if (kind === 'activities') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8.5 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7ZM2 21v-1c0-4 2.8-7 6-7s6 3 6 7v1H2Zm12.5 0c.3-.8.5-1.7.5-2.6 0-2-.7-3.8-1.8-5.1 1-.8 2.2-1.3 3.3-1.3 3 0 5.5 2.8 5.5 6.5V21h-7.5Z"/></svg>'
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 14 5.5l4-.6-.6 4 3.6 2.1-3.6 2.1.6 4-4-.6L12 20l-2-3.5-4 .6.6-4L3 11l3.6-2.1-.6-4 4 .6L12 2Zm-2.2 8.8-1.4 1.4 2.6 2.6 5-5-1.4-1.4-3.6 3.6-1.2-1.2Z"/></svg>'
}

function normalizeListNearSelection(doc: Document) {
  const selection = doc.getSelection()
  const node = selection?.anchorNode
  const element = node instanceof Element ? node : node?.parentElement
  const list = element?.closest('ul, ol') as HTMLElement | null
  if (!list) return
  list.style.listStylePosition = 'outside'
  list.style.paddingLeft = list.tagName === 'UL' ? '1.25em' : '1.5em'
  list.style.marginLeft = '0'
  if (list.tagName === 'UL') list.style.listStyleType = 'disc'
}

function findEducationSection(doc: Document) {
  const headings = Array.from(doc.querySelectorAll('h2'))
  const educationHeading = headings.find((heading) =>
    (heading.textContent || '').trim().toLowerCase().includes('education'),
  )
  return educationHeading?.closest('section') ?? doc.querySelector('.education-grid')?.closest('section')
}

function buildSectionHtml(doc: Document, kind: CvComponentKind) {
  const copy = SECTION_COPY[kind]
  const icon = sectionIcon(kind)
  const mainIcon = icon.replace('<svg ', '<svg class="main-icon" ')

  if (doc.querySelector('.main-section .timeline-body')) {
    return `<section class="main-section">
        <h2 class="main-heading">${mainIcon}${copy.title}</h2>
        <div class="timeline-body">
          <div class="timeline-rail"><span class="timeline-dot"></span></div>
          <div class="experience">${copy.body}</div>
        </div>
      </section>`
  }

  if (doc.querySelector('.timeline-section')) {
    return `<section class="timeline-section compact">
        <div class="timeline-rail">
          <span class="circle-icon">${icon}</span>
          <span class="timeline-dot"></span>
        </div>
        <div>
          <h2 class="section-heading">${copy.title}</h2>
          <div class="experience">${copy.body}</div>
        </div>
      </section>`
  }

  if (doc.querySelector('.education-grid')) {
    return `<section>
      <h2>${copy.title}</h2>
      <div class="experience">${copy.body}</div>
    </section>`
  }

  if (doc.querySelector('.section-rule')) {
    return `<section>
      <h2>${copy.title}</h2>
      <div class="experience">${copy.body}</div>
    </section>
    <hr class="section-rule" />`
  }

  return `<section>
    <h2 class="section-heading">${copy.title}</h2>
    <div class="experience">${copy.body}</div>
  </section>`
}

function ToolButton({
  active,
  title,
  children,
  onMouseDown,
}: {
  active?: boolean
  title: string
  children: React.ReactNode
  onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-lg font-semibold transition-colors ${
        active ? 'bg-violet-100 text-violet-700' : 'text-slate-800 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-7 w-px bg-slate-300" />
}

export default function HtmlOutputEditor({ outputPath }: { outputPath?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')
  const [fontFamily, setFontFamily] = useState('DM Sans')
  const [fontSize, setFontSize] = useState(28)
  const [formatState, setFormatState] = useState<FormatState>(DEFAULT_FORMAT)

  const url = useMemo(() => {
    if (!outputPath) return ''
    return `/api/cv/download?path=${encodeURIComponent(outputPath)}`
  }, [outputPath])

  const getEditorDocument = useCallback(() => iframeRef.current?.contentDocument ?? null, [])

  const saveSelection = useCallback(() => {
    const doc = getEditorDocument()
    const selection = doc?.getSelection()
    if (!selection || selection.rangeCount === 0) return
    savedRangeRef.current = selection.getRangeAt(0)
  }, [getEditorDocument])

  const restoreSelection = useCallback(() => {
    const doc = getEditorDocument()
    const range = savedRangeRef.current
    if (!doc || !range) return
    const selection = doc.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [getEditorDocument])

  const updateFormatState = useCallback(() => {
    const doc = getEditorDocument()
    if (!doc) return
    try {
      setFormatState({
        bold: doc.queryCommandState('bold'),
        italic: doc.queryCommandState('italic'),
        underline: doc.queryCommandState('underline'),
        strike: doc.queryCommandState('strikeThrough'),
        ordered: doc.queryCommandState('insertOrderedList'),
        unordered: doc.queryCommandState('insertUnorderedList'),
      })
    } catch {
      setFormatState(DEFAULT_FORMAT)
    }
    saveSelection()
  }, [getEditorDocument, saveSelection])

  const exec = useCallback((command: string, value?: string) => {
    const doc = getEditorDocument()
    const frame = iframeRef.current
    if (!doc || !frame) return
    frame.contentWindow?.focus()
    restoreSelection()
    doc.execCommand(command, false, value)
    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      normalizeListNearSelection(doc)
    }
    updateFormatState()
  }, [getEditorDocument, restoreSelection, updateFormatState])

  const insertComponent = useCallback((kind: CvComponentKind) => {
    const doc = getEditorDocument()
    const frame = iframeRef.current
    if (!doc || !frame) return

    const html = buildSectionHtml(doc, kind)
    const target = findEducationSection(doc)
    const page = doc.querySelector('.page')
    const anchor = target ?? (page?.lastElementChild as Element | null)

    if (anchor) {
      const range = doc.createRange()
      range.setStartAfter(anchor)
      range.collapse(true)
      const sel = doc.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      savedRangeRef.current = range
    }

    frame.contentWindow?.focus()
    doc.execCommand('insertHTML', false, html)

    const inserted = target?.nextElementSibling ?? page?.lastElementChild
    if (inserted instanceof HTMLElement) {
      inserted.scrollIntoView({ block: 'center' })
      const endRange = doc.createRange()
      endRange.selectNodeContents(inserted)
      endRange.collapse(false)
      const sel = doc.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(endRange)
      savedRangeRef.current = endRange
    }

    updateFormatState()
  }, [getEditorDocument, updateFormatState])

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
    const doc = getEditorDocument()
    if (!doc || !html) return
    doc.open()
    doc.write(html.replace('<main class="page">', '<main class="page" contenteditable="true" spellcheck="false">'))
    doc.close()

    const syncSelection = () => updateFormatState()
    doc.addEventListener('selectionchange', syncSelection)
    doc.addEventListener('keyup', syncSelection)
    doc.addEventListener('mouseup', syncSelection)
    doc.addEventListener('input', syncSelection)

    return () => {
      doc.removeEventListener('selectionchange', syncSelection)
      doc.removeEventListener('keyup', syncSelection)
      doc.removeEventListener('mouseup', syncSelection)
      doc.removeEventListener('input', syncSelection)
    }
  }, [getEditorDocument, html, updateFormatState])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-2">
        <select
          value={fontFamily}
          onChange={(event) => {
            setFontFamily(event.target.value)
            exec('fontName', event.target.value)
          }}
          className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-violet-300"
          title="Phông chữ"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>

        <div className="flex h-10 items-center rounded-lg border border-slate-300 bg-white">
          <button type="button" className="h-full px-3 text-lg font-semibold" onClick={() => {
            const next = Math.max(8, fontSize - 1)
            setFontSize(next)
            exec('fontSize', String(Math.max(1, Math.min(7, Math.round(next / 6)))))
          }}>-</button>
          <input
            value={fontSize}
            onChange={(event) => {
              const next = Number(event.target.value) || 12
              setFontSize(next)
              exec('fontSize', String(Math.max(1, Math.min(7, Math.round(next / 6)))))
            }}
            className="h-full w-12 text-center text-lg font-bold outline-none"
            title="Cỡ chữ"
          />
          <button type="button" className="h-full px-3 text-lg font-semibold" onClick={() => {
            const next = Math.min(72, fontSize + 1)
            setFontSize(next)
            exec('fontSize', String(Math.max(1, Math.min(7, Math.round(next / 6)))))
          }}>+</button>
        </div>

        <ToolButton title="Màu chữ" onMouseDown={(event) => event.preventDefault()}>
          <label className="relative grid cursor-pointer place-items-center">
            <span>A</span>
            <input
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => exec('foreColor', event.target.value)}
            />
            <span className="mt-1 h-1 w-6 rounded bg-linear-to-r from-red-500 via-yellow-400 to-blue-500" />
          </label>
        </ToolButton>

        <ToolButton title="In đậm" active={formatState.bold} onMouseDown={(event) => { event.preventDefault(); exec('bold') }}>
          B
        </ToolButton>
        <ToolButton title="In nghiêng" active={formatState.italic} onMouseDown={(event) => { event.preventDefault(); exec('italic') }}>
          <em>I</em>
        </ToolButton>
        <ToolButton title="Gạch chân" active={formatState.underline} onMouseDown={(event) => { event.preventDefault(); exec('underline') }}>
          <span className="underline">U</span>
        </ToolButton>
        <ToolButton title="Gạch ngang" active={formatState.strike} onMouseDown={(event) => { event.preventDefault(); exec('strikeThrough') }}>
          <span className="line-through">S</span>
        </ToolButton>

        <Divider />

        <ToolButton title="Cỡ chữ hoa/thường" onMouseDown={(event) => { event.preventDefault(); exec('formatBlock', 'h2') }}>
          aA
        </ToolButton>
        <ToolButton title="Căn trái" onMouseDown={(event) => { event.preventDefault(); exec('justifyLeft') }}>
          <span className="text-xl">≡</span>
        </ToolButton>
        <ToolButton title="Danh sách" active={formatState.unordered} onMouseDown={(event) => { event.preventDefault(); exec('insertUnorderedList') }}>
          <span className="text-xl">•≡</span>
        </ToolButton>
        <ToolButton title="Danh sách số" active={formatState.ordered} onMouseDown={(event) => { event.preventDefault(); exec('insertOrderedList') }}>
          <span className="text-base">1.</span>
        </ToolButton>
      </div>

      <div className="grid min-h-215 grid-cols-[220px_1fr] bg-slate-100">
        <aside className="border-r border-slate-200 bg-white p-3">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Thành phần</h3>
          <div className="grid gap-2">
            {CV_COMPONENTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  insertComponent(item.kind)
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs text-slate-700">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="p-4">
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <iframe
            ref={iframeRef}
            title="HTML CV editor"
            className="h-210 w-full rounded-lg border border-slate-200 bg-slate-100"
          />
        </div>
      </div>
    </div>
  )
}
