const JD_SEARCH_URL = process.env.JD_SEARCH_URL ?? 'http://localhost:8000'

export async function POST(request: Request) {
  const body = await request.json()

  const upstream = await fetch(`${JD_SEARCH_URL}/v1/jd/format`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await upstream.json()
  return Response.json(data, { status: upstream.status })
}
