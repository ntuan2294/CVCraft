import type { GenerateCVResponse } from '@/lib/types'

export function printCvEditorAsPdf() {
  const editor = document.querySelector('[data-cv-docx-editor="true"]')
  if (!editor) return

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n')
  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) return

  win.document.write(`
    <html>
      <head>
        <title></title>
        ${styles}
        <style>
          @page { margin: 0; size: A4; }
          body { margin: 0; background: #ffffff; }
          .docx-output-editor { min-height: auto !important; overflow: visible !important; padding: 0 !important; background: #ffffff !important; }
          .docx-wrapper { background: #ffffff !important; padding: 0 !important; box-shadow: none !important; }
          .docx-wrapper > section { box-shadow: none !important; margin: 0 auto !important; }
        </style>
      </head>
      <body>${editor.outerHTML}</body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

export function downloadGeneratedDocx(result: GenerateCVResponse | null) {
  if (!result?.output_path) return

  const a = document.createElement('a')
  a.href = `/api/cv/download?path=${encodeURIComponent(result.output_path)}`
  a.download = 'cv.docx'
  a.click()
}
