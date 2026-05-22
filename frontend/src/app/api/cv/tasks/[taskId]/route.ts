const GENERATE_CV_URL = process.env.GENERATE_CV_URL ?? 'http://localhost:8000'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params
  try {
    const upstream = await fetch(`${GENERATE_CV_URL}/v1/cv/tasks/${taskId}`)
    const data = await upstream.json().catch(() => ({ detail: upstream.statusText }))
    return Response.json(data, { status: upstream.status })
  } catch {
    return Response.json({ detail: 'Service không khả dụng' }, { status: 502 })
  }
}
