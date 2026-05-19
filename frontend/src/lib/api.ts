import type { JDSearchResponse, UserInput, GenerateCVResponse } from './types'

function formatApiError(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback

  const detail = (error as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg)
        }
        return ''
      })
      .filter(Boolean)
    return messages.length > 0 ? messages.join('. ') : fallback
  }

  return fallback
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(formatApiError(err, 'Request failed'))
  }
  return res.json()
}

export const api = {
  jd: {
    search: (query: string) =>
      post<JDSearchResponse>('/api/jd/search', { query }),
  },
  cv: {
    generate: (job_description: string, user_input: UserInput, max_revisions = 2) =>
      post<GenerateCVResponse>('/api/cv/generate', {
        job_description,
        user_input,
        max_revisions,
      }),
  },
}
