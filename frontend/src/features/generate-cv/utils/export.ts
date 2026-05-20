import type { GenerateCVResponse } from '@/lib/types'

export async function downloadCvAsPdf() {
  const editor = document.querySelector<HTMLElement>('[data-cv-docx-editor="true"]')
  if (!editor) return

  const html2pdf = (await import('html2pdf.js')).default
  await html2pdf()
    .set({
      margin: 0,
      filename: 'cv.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(editor)
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
