import type { AuthResponse, JobPost, CandidateProfile, ApplicationItem, Company, PageResponse, JobSearchParams } from './types'

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
  register: (data: { email: string; password: string; fullName: string; phone?: string; role: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>(`/auth/refresh?refreshToken=${refreshToken}`, { method: 'POST' }),
}

// Jobs
export const jobApi = {
  search: (params: JobSearchParams) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)))
    return request<PageResponse<JobPost>>(`/jobs?${qs}`)
  },
  getById: (id: number) => request<JobPost>(`/jobs/${id}`),
  getFeatured: (count = 6) => request<JobPost[]>(`/jobs/featured?count=${count}`),
  getCategories: () => request<string[]>('/jobs/categories'),
  getStats: () => request<Record<string, number>>('/jobs/stats'),
  create: (data: unknown) => request<JobPost>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<JobPost>(`/jobs/${id}/status?status=${status}`, { method: 'PATCH' }),
  delete: (id: number) => request<void>(`/jobs/${id}`, { method: 'DELETE' }),
  getMyJobs: (page = 0, size = 10) => request<PageResponse<JobPost>>(`/jobs/my?page=${page}&size=${size}`),
}

// Candidates
export const candidateApi = {
  search: (params: Record<string, unknown>) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)))
    return request<PageResponse<CandidateProfile>>(`/candidates?${qs}`)
  },
  getById: (id: number) => request<CandidateProfile>(`/candidates/${id}`),
  getMe: () => request<CandidateProfile>('/candidates/me'),
  updateMe: (data: unknown) => request<CandidateProfile>('/candidates/me', { method: 'PUT', body: JSON.stringify(data) }),
}

// Applications
export const applicationApi = {
  apply: (jobId: number, data: { coverLetter?: string; cvUrl?: string }) =>
    request<ApplicationItem>(`/applications/jobs/${jobId}`, { method: 'POST', body: JSON.stringify(data) }),
  getMyApplications: (page = 0, size = 10) =>
    request<PageResponse<ApplicationItem>>(`/applications/my?page=${page}&size=${size}`),
  withdraw: (id: number) => request<ApplicationItem>(`/applications/${id}/withdraw`, { method: 'PATCH' }),
  getJobApplications: (jobId: number, status?: string, page = 0) =>
    request<PageResponse<ApplicationItem>>(`/applications/jobs/${jobId}?${status ? `status=${status}&` : ''}page=${page}`),
  updateStatus: (id: number, status: string, note?: string) =>
    request<ApplicationItem>(`/applications/${id}/status?status=${status}${note ? `&note=${encodeURIComponent(note)}` : ''}`, { method: 'PATCH' }),
}

// Companies
export const companyApi = {
  search: (params: Record<string, unknown>) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)))
    return request<PageResponse<Company>>(`/companies?${qs}`)
  },
  getBySlug: (slug: string) => request<Company>(`/companies/${slug}`),
  getIndustries: () => request<string[]>('/companies/industries'),
  create: (data: unknown) => request<Company>('/companies', { method: 'POST', body: JSON.stringify(data) }),
}

// Bookmarks
export const bookmarkApi = {
  bookmarkJob: (jobId: number) => request(`/bookmarks/jobs/${jobId}`, { method: 'POST' }),
  removeJobBookmark: (jobId: number) => request(`/bookmarks/jobs/${jobId}`, { method: 'DELETE' }),
  bookmarkCandidate: (candidateId: number, note?: string) =>
    request(`/bookmarks/candidates/${candidateId}${note ? `?note=${encodeURIComponent(note)}` : ''}`, { method: 'POST' }),
  removeCandidate: (candidateId: number) => request(`/bookmarks/candidates/${candidateId}`, { method: 'DELETE' }),
  getBookmarks: (type: 'JOB' | 'CANDIDATE', page = 0) =>
    request(`/bookmarks?type=${type}&page=${page}`),
}
