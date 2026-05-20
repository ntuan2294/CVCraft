'use client'

import { useEffect, useRef, useState } from 'react'

type DocxOutputEditorProps = {
  outputPath?: string
}

type OnlyOfficeConfigResponse = {
  enabled: boolean
  documentServerUrl?: string
  config?: Record<string, unknown>
}

type DocsApi = {
  DocEditor: new (elementId: string, config: Record<string, unknown>) => { destroyEditor?: () => void }
}

declare global {
  interface Window {
    DocsAPI?: DocsApi
  }
}

const DATE_RANGE_AT_END =
  /(.+?)\s+((?:\d{1,2}\/\d{4}|\d{4})\s*-\s*(?:\d{1,2}\/\d{4}|\d{4}|Hiện tại|Hiện nay|Present))$/i

function isEffectivelyEmpty(node: Node) {
  return (node.textContent ?? '').replace(/\u200B/g, '').trim() === ''
}

function editableLineFromSelection(selection: Selection | null) {
  const node = selection?.anchorNode
  if (!node) return null

  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  return element?.closest<HTMLElement>('p, div, span')
}

function removeEmptyEditableLine(event: KeyboardEvent) {
  if (event.key !== 'Backspace') return

  const selection = window.getSelection()
  if (!selection?.isCollapsed) return

  const line = editableLineFromSelection(selection)
  if (!line || !line.closest('.docx-wrapper') || !isEffectivelyEmpty(line)) return

  const previous = line.previousElementSibling as HTMLElement | null
  if (!previous) return

  event.preventDefault()
  line.remove()

  const range = document.createRange()
  range.selectNodeContents(previous)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function insertSoftLineBreak(event: KeyboardEvent) {
  if (event.key !== 'Enter') return

  event.preventDefault()
  const selection = window.getSelection()
  if (!selection?.rangeCount) return

  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(document.createElement('br'))
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function insertEditableTab(event: KeyboardEvent) {
  if (event.key !== 'Tab') return

  event.preventDefault()
  const selection = window.getSelection()
  if (!selection?.rangeCount) return

  const tab = document.createElement('span')
  tab.className = 'cv-edit-tab'
  tab.contentEditable = 'false'
  tab.textContent = '\u00A0'

  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(tab)
  range.setStartAfter(tab)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

function alignDateRanges(root: HTMLElement) {
  const paragraphs = Array.from(root.querySelectorAll<HTMLElement>('p'))
  for (const paragraph of paragraphs) {
    if (paragraph.dataset.dateAligned === 'true') continue

    const text = (paragraph.textContent ?? '').replace(/\s+/g, ' ').trim()
    const match = text.match(DATE_RANGE_AT_END)
    if (!match) continue

    const [, label, dateRange] = match
    if (!label || label.length > 90 || /[.!?]$/.test(label)) continue

    const computedStyle = window.getComputedStyle(paragraph)
    paragraph.dataset.dateAligned = 'true'
    paragraph.classList.add('cv-date-line')
    paragraph.replaceChildren()

    const labelSpan = document.createElement('span')
    labelSpan.className = 'cv-date-line__label'
    labelSpan.textContent = label.trim()
    labelSpan.style.fontFamily = computedStyle.fontFamily
    labelSpan.style.fontSize = computedStyle.fontSize

    const dateSpan = document.createElement('span')
    dateSpan.className = 'cv-date-line__date'
    dateSpan.textContent = dateRange.trim()
    dateSpan.style.fontFamily = computedStyle.fontFamily
    dateSpan.style.fontSize = computedStyle.fontSize

    paragraph.append(labelSpan, dateSpan)
  }
}

export default function DocxOutputEditor({ outputPath }: DocxOutputEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onlyOfficeRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [onlyOfficeConfigState, setOnlyOfficeConfigState] = useState<{
    outputPath: string
    response: OnlyOfficeConfigResponse
  } | null>(null)

  const onlyOfficeConfig =
    onlyOfficeConfigState && onlyOfficeConfigState.outputPath === outputPath
      ? onlyOfficeConfigState.response
      : null

  useEffect(() => {
    let cancelled = false
    if (!outputPath) return

    async function loadConfig() {
      if (!outputPath) return
      try {
        const response = await fetch(`/api/cv/onlyoffice/config?path=${encodeURIComponent(outputPath)}`, {
          cache: 'no-store',
        })
        const config = await response.json()
        if (!cancelled) setOnlyOfficeConfigState({ outputPath, response: config })
      } catch {
        if (!cancelled) setOnlyOfficeConfigState({ outputPath, response: { enabled: false } })
      }
    }

    loadConfig()
    return () => {
      cancelled = true
    }
  }, [outputPath])

  useEffect(() => {
    const documentServerUrl = onlyOfficeConfig?.documentServerUrl
    const editorConfig = onlyOfficeConfig?.config
    if (!outputPath || !onlyOfficeConfig?.enabled || !documentServerUrl || !editorConfig) {
      return
    }
    const currentOutputPath = outputPath
    const currentDocumentServerUrl = documentServerUrl
    const currentEditorConfig = editorConfig

    let editor: { destroyEditor?: () => void } | null = null
    let cancelled = false
    const scriptId = 'onlyoffice-docs-api'

    async function loadOnlyOffice() {
      setLoading(true)
      setError('')
      try {
        if (!document.getElementById(scriptId)) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.id = scriptId
            script.src = `${currentDocumentServerUrl}/web-apps/apps/api/documents/api.js`
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Không tải được OnlyOffice Docs API.'))
            document.body.appendChild(script)
          })
        }

        if (cancelled || !window.DocsAPI || !onlyOfficeRef.current) return
        onlyOfficeRef.current.innerHTML = ''
        const holder = document.createElement('div')
        holder.id = `onlyoffice-editor-${Date.now()}`
        holder.className = 'h-full min-h-240'
        onlyOfficeRef.current.appendChild(holder)
        editor = new window.DocsAPI.DocEditor(holder.id, currentEditorConfig)
      } catch (err) {
        if (!cancelled) {
          setOnlyOfficeConfigState({ outputPath: currentOutputPath, response: { enabled: false } })
          setError(err instanceof Error ? err.message : 'Không mở được OnlyOffice editor.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOnlyOffice()
    return () => {
      cancelled = true
      editor?.destroyEditor?.()
    }
  }, [onlyOfficeConfig, outputPath])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''
    if (!outputPath || onlyOfficeConfig === null || onlyOfficeConfig.enabled) return
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
          experimental: true,
        })

        const editableRoot = containerRef.current.querySelector('.docx-wrapper') as HTMLElement | null
        if (editableRoot) alignDateRanges(editableRoot)
        const target = editableRoot ?? containerRef.current
        target.contentEditable = 'true'
        target.spellcheck = false
        target.setAttribute('aria-label', 'Chỉnh sửa CV trực tiếp')
        target.addEventListener('keydown', insertEditableTab)
        target.addEventListener('keydown', insertSoftLineBreak)
        target.addEventListener('keydown', removeEmptyEditableLine)
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
      const editableRoot = container.querySelector('.docx-wrapper') as HTMLElement | null
      editableRoot?.removeEventListener('keydown', insertEditableTab)
      editableRoot?.removeEventListener('keydown', insertSoftLineBreak)
      editableRoot?.removeEventListener('keydown', removeEmptyEditableLine)
    }
  }, [onlyOfficeConfig, outputPath])

  return (
    <div data-cv-docx-editor="true" className="docx-output-editor min-h-240 overflow-auto rounded-xl bg-slate-200 p-4">
      {!outputPath && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Chưa có file CV để hiển thị.
        </div>
      )}
      {loading && (
        <div className="flex min-h-180 items-center justify-center rounded-lg bg-white text-sm text-gray-500">
          Đang hiển thị file CV...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {onlyOfficeConfig?.enabled && <div ref={onlyOfficeRef} className="h-[960px] min-h-240 bg-white" />}
      <div ref={containerRef} className={loading || error ? 'hidden' : 'docx-render-host outline-none'} />
    </div>
  )
}
