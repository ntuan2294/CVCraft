import HTMLtoDOCX from 'html-to-docx'

export const runtime = 'nodejs'

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { html?: unknown }
    const html = typeof body.html === 'string' ? body.html : ''

    if (!html.trim()) {
      return Response.json({ error: 'Missing HTML content' }, { status: 400 })
    }

    const docx = await HTMLtoDOCX(html, undefined, {
      title: 'CV',
      creator: 'CVCraft',
      orientation: 'portrait',
      pageSize: {
        width: 11906,
        height: 16838,
      },
      margins: {
        top: 720,
        right: 720,
        bottom: 720,
        left: 720,
        header: 360,
        footer: 360,
        gutter: 0,
      },
      font: 'Arial',
      fontSize: 22,
      complexScriptFontSize: 22,
      decodeUnicode: true,
      lang: 'vi-VN',
      table: {
        row: {
          cantSplit: true,
        },
      },
    })

    const data = docx instanceof Blob
      ? Buffer.from(await docx.arrayBuffer())
      : Buffer.from(docx)

    return new Response(data, {
      headers: {
        'Content-Type': DOCX_CONTENT_TYPE,
        'Content-Disposition': 'attachment; filename="cv.docx"',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to convert HTML to DOCX'
    return Response.json({ error: message }, { status: 500 })
  }
}
