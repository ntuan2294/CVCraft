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
  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="cv.docx"',
    },
  })
}
