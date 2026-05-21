import type { AuthResponse, UserProfile, CvDocument, PageResponse } from './types'

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cvcraft_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BACKEND_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? err.message ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>(`/auth/refresh?refreshToken=${refreshToken}`, { method: 'POST' }),
}

// CV Profile (personal info used for CV generation)
export const profileApi = {
  getMe: () => request<UserProfile>('/profile'),
  updateMe: (data: Partial<UserProfile>) =>
    request<UserProfile>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
}

// CV Document Library
export const cvDocumentApi = {
  getMyCvs: (page = 0, size = 20) =>
    request<PageResponse<CvDocument>>(`/cv-docs?page=${page}&size=${size}`),
  saveCv: (data: {
    title?: string
    templateId?: string
    fileName?: string
    downloadUrl?: string
    atsScore?: number
    jdTitle?: string
    jdText?: string
  }) => request<CvDocument>('/cv-docs', { method: 'POST', body: JSON.stringify(data) }),
  setPrimary: (id: number) =>
    request<CvDocument>(`/cv-docs/${id}/primary`, { method: 'PATCH' }),
  deleteCv: (id: number) =>
    request<void>(`/cv-docs/${id}`, { method: 'DELETE' }),
  getStats: () =>
    request<{ totalCvs: number }>('/cv-docs/stats'),
}
