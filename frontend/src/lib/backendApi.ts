import type { AuthResponse, UserProfile, CvDocument, PageResponse, AdminDashboardStats, AdminUser, AdminCvDocument, UserRole, CvTemplate } from './types'

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cvcraft_token')
}

export class ApiError extends Error {
  fields?: Record<string, string>
  constructor(message: string, fields?: Record<string, string>) {
    super(message)
    this.fields = fields
  }
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
    throw new ApiError(err.detail ?? err.message ?? 'Request failed', err.errors)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    request<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>(`/auth/refresh?refreshToken=${refreshToken}`, { method: 'POST' }),
  verifyEmail: (email: string, otpCode: string) =>
    request<AuthResponse>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, otpCode }) }),
  resendVerification: (email: string) =>
    request<{ message: string }>('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
}

// CV Profile (personal info used for CV generation)
export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  headline?: string
  bio?: string
  location?: string
  experienceYears?: number
  experienceLevel?: string
  skills?: string[]
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  workExperiences?: string
  educations?: string
  certifications?: string
  languages?: string
  projects?: string
  referencesInfo?: string
}

export const profileApi = {
  getMe: () => request<UserProfile>('/profile'),
  updateMe: (data: UpdateProfileRequest) =>
    request<UserProfile>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
}

// CV Document Library
export const cvDocumentApi = {
  getMyCvs: (page = 0, size = 20) =>
    request<PageResponse<CvDocument>>(`/cv-docs?page=${page}&size=${size}`),
  getCv: (id: number) =>
    request<CvDocument>(`/cv-docs/${id}`),
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

export const cvTemplateApi = {
  getAll: () => request<CvTemplate[]>('/cv-templates'),
}

export const adminApi = {
  getDashboardStats: () =>
    request<AdminDashboardStats>('/admin/dashboard'),
  getUsers: (query = '', page = 0, size = 20) =>
    request<PageResponse<AdminUser>>(`/admin/users?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  createUser: (data: {
    email: string
    password: string
    fullName: string
    phone?: string
    role: UserRole
    isActive?: boolean
    isEmailVerified?: boolean
  }) => request<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: {
    email: string
    password?: string
    fullName: string
    phone?: string
    role: UserRole
    isActive: boolean
    isEmailVerified: boolean
  }) => request<AdminUser>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  getCvDocuments: (query = '', page = 0, size = 20) =>
    request<PageResponse<AdminCvDocument>>(`/admin/cv-docs?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  updateCvDocument: (id: number, data: {
    title?: string
    templateId?: string
    fileName?: string
    downloadUrl?: string
    atsScore?: number
    jdTitle?: string
    isPrimary?: boolean
  }) => request<AdminCvDocument>(`/admin/cv-docs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCvDocument: (id: number) =>
    request<void>(`/admin/cv-docs/${id}`, { method: 'DELETE' }),
  getCvTemplates: (query = '', page = 0, size = 20) =>
    request<PageResponse<CvTemplate>>(`/admin/cv-templates?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  deleteCvTemplate: (id: number) =>
    request<void>(`/admin/cv-templates/${id}`, { method: 'DELETE' }),
}
