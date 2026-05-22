const GENERATE_CV_URL = process.env.GENERATE_CV_URL ?? 'http://localhost:8000'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) return Response.json({ error: 'Thiếu path' }, { status: 400 })

  const upstream = await fetch(
    `${GENERATE_CV_URL}/v1/cv/download?path=${encodeURIComponent(path)}`
  )
  if (!upstream.ok) return Response.json({ error: 'File không tìm thấy' }, { status: 404 })

  const buffer = await upstream.arrayBuffer()
  const contentType = upstream.headers.get('content-type') ?? ''
  const isHtml = contentType.includes('text/html') || path.toLowerCase().endsWith('.html')
  return new Response(buffer, {
    headers: {
      'Content-Type': isHtml
        ? 'text/html; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${isHtml ? 'cv.html' : 'cv.docx'}"`,
    },
  })
}
