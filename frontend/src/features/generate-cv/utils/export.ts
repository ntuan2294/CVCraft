import type { GenerateCVResponse } from '@/lib/types'

function getHtmlEditorPage() {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="HTML CV editor"]')
  return iframe?.contentDocument?.querySelector<HTMLElement>('.page') ?? null
}

function getDocxEditorTargets() {
  const editor = document.querySelector<HTMLElement>('[data-cv-docx-editor="true"]')
  if (!editor) return []
  const pages = Array.from(editor.querySelectorAll<HTMLElement>('.docx-wrapper > section'))
  return pages.length > 0 ? pages : [editor]
}

function getCvEditorTargets() {
  const htmlPage = getHtmlEditorPage()
  return htmlPage ? [htmlPage] : getDocxEditorTargets()
}

export async function downloadCvEditorAsPdf() {
  const targets = getCvEditorTargets()
  if (targets.length === 0) return

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
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
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

export async function downloadCvEditorAsImage(format: 'png' | 'jpg' = 'png') {
  const targets = getCvEditorTargets()
  if (targets.length === 0) return

  const { default: html2canvas } = await import('html2canvas')

  for (const [index, target] of targets.entries()) {
    const canvas = await html2canvas(target, {
      backgroundColor: '#ffffff',
      scale: 3,
      useCORS: true,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    })

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
    const extension = format === 'jpg' ? 'jpg' : 'png'
    const a = document.createElement('a')
    a.href = canvas.toDataURL(mime, 0.95)
    a.download = targets.length > 1 ? `cv-${index + 1}.${extension}` : `cv.${extension}`
    a.click()
  }
}

export async function downloadGeneratedDocx(result: GenerateCVResponse | null) {
  if (!result?.output_path) return

  const a = document.createElement('a')
  a.href = `/api/cv/download?path=${encodeURIComponent(result.output_path)}`
  a.download = 'cv.docx'
  a.click()
}

export async function downloadCvFileAsPdf(downloadUrl: string, title: string = 'cv') {
  const response = await fetch(downloadUrl)
  if (!response.ok) throw new Error('Không tải được file CV.')

  const contentType = response.headers.get('content-type') || ''
  const isHtml = contentType.includes('text/html') || downloadUrl.toLowerCase().includes('.html')

  // Create a hidden container
  const hiddenContainer = document.createElement('div')
  hiddenContainer.style.position = 'fixed'
  hiddenContainer.style.top = '-9999px'
  hiddenContainer.style.left = '-9999px'
  hiddenContainer.style.width = '794px' // A4 width at 96 DPI
  hiddenContainer.style.backgroundColor = '#ffffff'
  document.body.appendChild(hiddenContainer)

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    let targets: HTMLElement[] = []

    if (isHtml) {
      const htmlText = await response.text()
      const iframe = document.createElement('iframe')
      iframe.style.width = '794px'
      iframe.style.height = '1123px' // A4 height at 96 DPI
      hiddenContainer.appendChild(iframe)

      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) throw new Error('Cannot write to iframe')
      doc.open()
      doc.write(htmlText)
      doc.close()

      // Wait for resources/stylesheets to load
      await new Promise(resolve => setTimeout(resolve, 600))

      const page = doc.querySelector('.page') || doc.body
      targets = [page as HTMLElement]
    } else {
      const blob = await response.blob()
      const { renderAsync } = await import('docx-preview')

      const docxContainer = document.createElement('div')
      docxContainer.className = 'docx-render-host'
      hiddenContainer.appendChild(docxContainer)

      await renderAsync(blob, docxContainer, undefined, {
        className: 'docx',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        useBase64URL: false,
      })

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 600))

      const pages = Array.from(docxContainer.querySelectorAll<HTMLElement>('.docx-wrapper > section'))
      targets = pages.length > 0 ? pages : [docxContainer]
    }

    if (targets.length === 0) throw new Error('No targets to print')

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    for (const [index, target] of targets.entries()) {
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        windowWidth: target.scrollWidth || 794,
        windowHeight: target.scrollHeight || 1123,
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

    pdf.save(`${title.replace(/[\s\/:*?"<>|]+/g, '_')}.pdf`)
  } finally {
    document.body.removeChild(hiddenContainer)
  }
}
