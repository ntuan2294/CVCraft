const GENERATE_CV_URL = process.env.GENERATE_CV_URL ?? 'http://localhost:8000'

export async function POST(request: Request) {
  const body = await request.json()
  try {
    const upstream = await fetch(`${GENERATE_CV_URL}/v1/cv/generate/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await upstream.json().catch(() => ({ detail: upstream.statusText }))
    return Response.json(data, { status: upstream.status })
  } catch {
    return Response.json(
      { detail: 'Generate CV service chưa chạy. Hãy khởi động backend ở localhost:8000.' },
      { status: 502 },
    )
  }
}
