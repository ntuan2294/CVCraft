const GENERATE_CV_URL = process.env.GENERATE_CV_URL ?? 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const upstream = await fetch(`${GENERATE_CV_URL}/v1/review-cv/analyze`, {
      method: 'POST',
      body: formData,
    })
    const data = await upstream.json().catch(() => ({
      detail: upstream.statusText || 'Review CV service returned an invalid response',
    }))
    return Response.json(data, { status: upstream.status })
  } catch {
    return Response.json(
      { detail: 'Generate CV service chưa chạy. Hãy khởi động backend ở localhost:8000.' },
      { status: 502 },
    )
  }
}
