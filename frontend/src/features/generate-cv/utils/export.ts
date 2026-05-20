import type { GenerateCVResponse } from '@/lib/types'

export async function downloadCvAsPdf() {
  const editor = document.querySelector<HTMLElement>('[data-cv-docx-editor="true"]')
  if (!editor) return

  const page = editor.querySelector<HTMLElement>('.docx-wrapper > section') ?? editor
  const html2pdf = (await import('html2pdf.js')).default
  const options = {
    margin: 0,
    filename: 'cv.pdf',
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (_clonedDocument: Document, clonedElement: HTMLElement) => {
        clonedElement.style.backgroundColor = '#ffffff'
        clonedElement.style.color = '#111827'
        clonedElement.style.boxShadow = 'none'
        clonedElement.style.outline = 'none'
      },
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    pagebreak: { mode: ['css', 'legacy'], avoid: ['p', 'table', 'tr'] },
  }

  await html2pdf()
    .set(options)
    .from(page)
    .save()
}

export function downloadGeneratedDocx(result: GenerateCVResponse | null) {
  if (!result?.output_path) return

  const a = document.createElement('a')
  a.href = `/api/cv/download?path=${encodeURIComponent(result.output_path)}`
  a.download = 'cv.docx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
