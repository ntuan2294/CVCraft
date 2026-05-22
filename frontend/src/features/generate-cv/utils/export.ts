import type { GenerateCVResponse } from '@/lib/types'

export async function downloadCvEditorAsPdf() {
  const editor = document.querySelector<HTMLElement>('[data-cv-docx-editor="true"]')
  if (!editor) return

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) return

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n')

  const content = editor.innerHTML

  printWindow.document.write(`
    <html>
      <head>
        <title>cv.pdf</title>
        ${styles}
        <style>
          body {
            margin: 0;
            padding: 24px;
            background: #e2e8f0;
          }

          .print-root {
            display: flex;
            justify-content: center;
          }

          .docx-wrapper {
            margin: 0 auto;
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-root">${content}</div>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.onload = () => {
    printWindow.print()
    printWindow.onafterprint = () => printWindow.close()
  }
}

export function downloadGeneratedDocx(result: GenerateCVResponse | null) {
  if (!result?.output_path) return

  const isHtml = result.output_path.toLowerCase().endsWith('.html')
  const a = document.createElement('a')
  a.href = `/api/cv/download?path=${encodeURIComponent(result.output_path)}`
  a.download = isHtml ? 'cv.html' : 'cv.docx'
  a.click()
}
