import type { GenerateCVResponse } from '@/lib/types'

export async function downloadCvEditorAsPdf() {
  const editor = document.querySelector('[data-cv-docx-editor="true"]')
  if (!editor) return

  const pages = Array.from(editor.querySelectorAll<HTMLElement>('.docx-wrapper > section'))
  const targets = pages.length > 0 ? pages : [editor as HTMLElement]
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  for (const [index, target] of targets.entries()) {
    const canvas = await html2canvas(target, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })
    const image = canvas.toDataURL('image/png')
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
    const width = canvas.width * ratio
    const height = canvas.height * ratio
    const x = (pageWidth - width) / 2
    const y = (pageHeight - height) / 2

    if (index > 0) pdf.addPage()
    pdf.addImage(image, 'PNG', x, y, width, height)
  }

  pdf.save('cv.pdf')
}

export function downloadGeneratedDocx(result: GenerateCVResponse | null) {
  if (!result?.output_path) return

  const a = document.createElement('a')
  a.href = `/api/cv/download?path=${encodeURIComponent(result.output_path)}`
  a.download = 'cv.docx'
  a.click()
}
