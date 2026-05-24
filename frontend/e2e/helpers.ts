import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

type UserRole = 'CANDIDATE' | 'ADMIN'

type AuthUser = {
  id: number
  email: string
  fullName: string
  role: UserRole
}

type UserProfile = {
  id: number
  userId: number
  fullName: string
  email: string
  headline?: string
  bio?: string
  location?: string
  experienceYears?: number
  skills: string[]
  linkedinUrl?: string
  githubUrl?: string
  createdAt: string
}

type CvDocument = {
  id: number
  title: string
  templateId?: string
  fileName?: string
  downloadUrl?: string
  atsScore?: number
  jdTitle?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

type AdminUser = {
  id: number
  email: string
  fullName: string
  phone?: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

type AdminCvDocument = {
  id: number
  userId: number
  userEmail: string
  userFullName: string
  title: string
  templateId?: string
  fileName?: string
  downloadUrl?: string
  atsScore?: number
  jdTitle?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

type CvTemplate = {
  id: number
  name: string
  description?: string
  fields: string[]
  supportsPhotoUpload: boolean
  summaryLabel?: string
  thumbnail?: string
  createdAt?: string
  updatedAt?: string
}

type AdminDashboardStats = {
  totalUsers: number
  totalCandidates: number
  totalAdmins: number
  activeUsers: number
  inactiveUsers: number
  totalCvDocuments: number
  cvsCreatedLast7Days: number
}

type JDCardResult = {
  id: string
  title: string
  company?: string
  industry?: string
  seniority?: string
  similarity_score: number
}

type JDFormattedDetail = {
  id: string
  description_bullets: string[]
  requirements_bullets: string[]
  benefits_bullets: string[]
  quick_info: Record<string, string>
}

type GenerateCvResponse = {
  status: string
  output_path?: string
  quality_score?: {
    ats_score: number
    jd_match_score: number
    linguistic_score: number
    overall_score: number
    feedback: string[]
    needs_revision: boolean
  }
  messages: string[]
}

type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

const NOW = new Date('2026-05-22T10:00:00.000Z').toISOString()
const THREE_DAYS_AGO = new Date('2026-05-19T10:00:00.000Z').toISOString()
const TEN_DAYS_AGO = new Date('2026-05-12T10:00:00.000Z').toISOString()
const DOCX_FIXTURE_PATH = path.resolve(process.cwd(), '..', 'backend', 'template cv', '1.docx')

export const candidateUser: AuthUser = {
  id: 1,
  email: 'candidate@test.com',
  fullName: 'Test Candidate',
  role: 'CANDIDATE',
}

export const adminUser: AuthUser = {
  id: 2,
  email: 'admin@cvcraft.com',
  fullName: 'CVCraft Admin',
  role: 'ADMIN',
}

export const candidateProfile: UserProfile = {
  id: 101,
  userId: candidateUser.id,
  fullName: candidateUser.fullName,
  email: candidateUser.email,
  headline: 'Backend Engineer',
  bio: 'Builds scalable Java services and REST APIs.',
  location: 'Ho Chi Minh City',
  experienceYears: 4,
  skills: ['Java', 'Spring Boot', 'PostgreSQL'],
  linkedinUrl: 'https://linkedin.com/in/test-candidate',
  githubUrl: 'https://github.com/test-candidate',
  createdAt: TEN_DAYS_AGO,
}

export const candidateCvDocs: CvDocument[] = [
  {
    id: 201,
    title: 'Java Backend CV',
    templateId: '1',
    fileName: 'java-backend-cv.docx',
    downloadUrl: '/files/java-backend-cv.docx',
    atsScore: 89,
    jdTitle: 'Senior Backend Engineer',
    isPrimary: true,
    createdAt: TEN_DAYS_AGO,
    updatedAt: TEN_DAYS_AGO,
  },
  {
    id: 202,
    title: 'Platform Engineer CV',
    templateId: '3',
    fileName: 'platform-engineer-cv.docx',
    downloadUrl: '/files/platform-engineer-cv.docx',
    atsScore: 82,
    jdTitle: 'Platform Engineer',
    isPrimary: false,
    createdAt: THREE_DAYS_AGO,
    updatedAt: THREE_DAYS_AGO,
  },
]

export const adminUsers: AdminUser[] = [
  {
    id: adminUser.id,
    email: adminUser.email,
    fullName: adminUser.fullName,
    phone: '0900000001',
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
    createdAt: TEN_DAYS_AGO,
    updatedAt: NOW,
  },
  {
    id: candidateUser.id,
    email: candidateUser.email,
    fullName: candidateUser.fullName,
    phone: '0900000002',
    role: 'CANDIDATE',
    isActive: true,
    isEmailVerified: true,
    createdAt: THREE_DAYS_AGO,
    updatedAt: NOW,
  },
]

export const adminCvTemplates: CvTemplate[] = [
  {
    id: 1,
    name: 'Classic Template',
    description: 'Clean and professional single-column layout',
    fields: ['name', 'email', 'phone', 'skills', 'experience'],
    supportsPhotoUpload: false,
    summaryLabel: 'Summary',
    createdAt: TEN_DAYS_AGO,
    updatedAt: NOW,
  },
  {
    id: 2,
    name: 'Modern Template',
    description: 'Contemporary two-column design with photo support',
    fields: ['name', 'email', 'phone', 'photo', 'skills', 'experience'],
    supportsPhotoUpload: true,
    summaryLabel: 'Profile',
    createdAt: THREE_DAYS_AGO,
    updatedAt: NOW,
  },
]

export const adminCvDocs: AdminCvDocument[] = [
  {
    id: 301,
    userId: candidateUser.id,
    userEmail: candidateUser.email,
    userFullName: candidateUser.fullName,
    title: 'Candidate Primary CV',
    templateId: '1',
    fileName: 'candidate-primary.docx',
    downloadUrl: '/files/candidate-primary.docx',
    atsScore: 91,
    jdTitle: 'Senior Backend Engineer',
    isPrimary: true,
    createdAt: THREE_DAYS_AGO,
    updatedAt: NOW,
  },
  {
    id: 302,
    userId: candidateUser.id,
    userEmail: candidateUser.email,
    userFullName: candidateUser.fullName,
    title: 'Candidate Data CV',
    templateId: '4',
    fileName: 'candidate-data.docx',
    downloadUrl: '/files/candidate-data.docx',
    atsScore: 84,
    jdTitle: 'Data Engineer',
    isPrimary: false,
    createdAt: TEN_DAYS_AGO,
    updatedAt: TEN_DAYS_AGO,
  },
]

export const jdResults: JDCardResult[] = [
  {
    id: 'jd-react-1',
    title: 'Senior React Developer',
    company: 'Acme Tech',
    industry: 'tech',
    seniority: 'senior',
    similarity_score: 0.96,
  },
  {
    id: 'jd-react-2',
    title: 'Frontend Platform Engineer',
    company: 'Northwind Labs',
    industry: 'engineering',
    seniority: 'mid',
    similarity_score: 0.87,
  },
]

export const jdDetails: Record<string, JDFormattedDetail> = {
  'jd-react-1': {
    id: 'jd-react-1',
    description_bullets: [
      'Build scalable React and Next.js product surfaces.',
      'Collaborate with backend and design teams to ship features weekly.',
    ],
    requirements_bullets: [
      '4+ years of React experience.',
      'Strong knowledge of TypeScript and performance optimization.',
    ],
    benefits_bullets: [
      'Remote-first setup.',
      'Annual learning budget.',
    ],
    quick_info: {
      salary: '$2500 - $3500',
      location: 'Ho Chi Minh City',
      experience_level: 'Senior',
      job_position: 'Frontend',
    },
  },
  'jd-react-2': {
    id: 'jd-react-2',
    description_bullets: ['Own frontend platform tooling for multiple teams.'],
    requirements_bullets: ['Experience with design systems and shared tooling.'],
    benefits_bullets: ['Hybrid schedule.'],
    quick_info: {
      location: 'Hanoi',
      experience_level: 'Mid-level',
    },
  },
}

export const generatedCvResult: GenerateCvResponse = {
  status: 'success',
  output_path: 'generated/mock-cv.docx',
  quality_score: {
    ats_score: 90,
    jd_match_score: 88,
    linguistic_score: 92,
    overall_score: 89,
    feedback: ['Strong keyword coverage', 'Clear experience bullets'],
    needs_revision: false,
  },
  messages: ['CV generated successfully'],
}

export async function useEnglishLocale(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('cvcraft_locale', 'en')
  })
}

export async function clearAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('cvcraft_token')
    localStorage.removeItem('cvcraft_refresh')
    localStorage.removeItem('cvcraft_user')
  })
}

export async function mockAuthAsCandidate(page: Page) {
  await seedAuth(page, candidateUser)
}

export async function mockAuthAsAdmin(page: Page) {
  await seedAuth(page, adminUser)
}

async function seedAuth(page: Page, user: AuthUser) {
  await page.addInitScript((seedUser) => {
    localStorage.setItem('cvcraft_token', 'mock-access-token')
    localStorage.setItem('cvcraft_refresh', 'mock-refresh-token')
    localStorage.setItem('cvcraft_user', JSON.stringify(seedUser))
  }, user)
}

export async function mockAuthApi(page: Page, options?: {
  loginUser?: AuthUser
  registerUser?: AuthUser
}) {
  const loginUser = options?.loginUser ?? candidateUser
  const registerUser = options?.registerUser ?? candidateUser

  await page.route('**/api/auth/**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()

    if (method === 'POST' && url.pathname.endsWith('/api/auth/login')) {
      return fulfillJson(route, {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: loginUser,
      })
    }

    if (method === 'POST' && url.pathname.endsWith('/api/auth/register')) {
      // Registration returns a MessageResponse, not tokens — the page always
      // redirects to /auth/verify-email for OTP confirmation afterwards.
      return fulfillJson(route, {
        message: 'Registration successful. Please check your email for the OTP verification code.',
      })
    }

    return route.fulfill({ status: 404, body: 'Not Found' })
  })
}

export async function mockCandidateApis(page: Page, options?: {
  profile?: UserProfile
  cvs?: CvDocument[]
}) {
  const profile = clone(options?.profile ?? candidateProfile)
  let docs = clone(options?.cvs ?? candidateCvDocs)

  await page.route('**/api/profile', async (route) => {
    if (route.request().method() !== 'GET') {
      return route.fulfill({ status: 405, body: 'Method Not Allowed' })
    }
    return fulfillJson(route, profile)
  })

  await page.route('**/api/cv-docs**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const pathname = url.pathname

    if (method === 'GET' && pathname.endsWith('/api/cv-docs')) {
      return fulfillJson(route, pageOf(docs))
    }

    if (method === 'POST' && pathname.endsWith('/api/cv-docs')) {
      const body = parseJson(route.request().postData())
      const newDoc: CvDocument = {
        id: nextId(docs.map((item) => item.id)),
        title: body.title ?? 'My CV',
        templateId: body.templateId,
        fileName: body.fileName,
        downloadUrl: body.downloadUrl,
        atsScore: body.atsScore,
        jdTitle: body.jdTitle,
        isPrimary: docs.length === 0,
        createdAt: NOW,
        updatedAt: NOW,
      }
      docs = [newDoc, ...docs]
      return fulfillJson(route, newDoc)
    }

    const setPrimaryMatch = pathname.match(/\/api\/cv-docs\/(\d+)\/primary$/)
    if (method === 'PATCH' && setPrimaryMatch) {
      const selectedId = Number(setPrimaryMatch[1])
      const docToToggle = docs.find((item) => item.id === selectedId)
      const wasPrimary = docToToggle?.isPrimary ?? false
      docs = docs.map((item) => ({
        ...item,
        isPrimary: item.id === selectedId ? !wasPrimary : false,
        updatedAt: item.id === selectedId ? NOW : item.updatedAt,
      }))
      const updated = docs.find((item) => item.id === selectedId)
      return fulfillJson(route, updated)
    }

    const deleteMatch = pathname.match(/\/api\/cv-docs\/(\d+)$/)
    if (method === 'DELETE' && deleteMatch) {
      const selectedId = Number(deleteMatch[1])
      docs = docs.filter((item) => item.id !== selectedId)
      return route.fulfill({ status: 204, body: '' })
    }

    return route.fulfill({ status: 404, body: 'Not Found' })
  })
}

// ── UC-03 / UC-04: OTP verification & resend ───────────────────────────────
export async function mockOtpApi(page: Page, options?: {
  verifyUser?: AuthUser
}) {
  const verifyUser = options?.verifyUser ?? candidateUser

  await page.route('**/api/auth/verify-email', async (route) => {
    return fulfillJson(route, {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: verifyUser,
    })
  })

  await page.route('**/api/auth/resend-verification', async (route) => {
    return fulfillJson(route, { message: 'OTP resent successfully. Please check your email.' })
  })
}

export async function mockAdminApi(page: Page, options?: {
  users?: AdminUser[]
  cvs?: AdminCvDocument[]
  templates?: CvTemplate[]
}) {
  let users = clone(options?.users ?? adminUsers)
  let cvs = clone(options?.cvs ?? adminCvDocs)
  let templates = clone(options?.templates ?? adminCvTemplates)

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const pathname = url.pathname

    if (method === 'GET' && pathname.endsWith('/api/admin/dashboard')) {
      return fulfillJson(route, buildAdminStats(users, cvs))
    }

    if (method === 'GET' && pathname.endsWith('/api/admin/users')) {
      const query = (url.searchParams.get('query') ?? '').toLowerCase()
      const filtered = users
        .filter((item) => matchesQuery(query, item.fullName, item.email))
        .map((item) => ({
          ...item,
          cvCount: cvs.filter((cv) => cv.userId === item.id).length,
        }))
      return fulfillJson(route, pageOf(filtered))
    }

    if (method === 'POST' && pathname.endsWith('/api/admin/users')) {
      const body = parseJson(route.request().postData())
      const created: AdminUser = {
        id: nextId(users.map((item) => item.id)),
        email: body.email,
        fullName: body.fullName,
        phone: body.phone,
        role: body.role ?? 'CANDIDATE',
        isActive: body.isActive ?? true,
        isEmailVerified: body.isEmailVerified ?? false,
        createdAt: NOW,
        updatedAt: NOW,
      }
      users = [created, ...users]
      return fulfillJson(route, { ...created, cvCount: 0 })
    }

    const updateUserMatch = pathname.match(/\/api\/admin\/users\/(\d+)$/)
    if (method === 'PUT' && updateUserMatch) {
      const selectedId = Number(updateUserMatch[1])
      const body = parseJson(route.request().postData())
      users = users.map((item) => item.id === selectedId ? {
        ...item,
        email: body.email,
        fullName: body.fullName,
        phone: body.phone,
        role: body.role,
        isActive: body.isActive,
        isEmailVerified: body.isEmailVerified,
        updatedAt: NOW,
      } : item)
      const updated = users.find((item) => item.id === selectedId)
      return fulfillJson(route, { ...updated, cvCount: cvs.filter((cv) => cv.userId === selectedId).length })
    }

    if (method === 'DELETE' && updateUserMatch) {
      const selectedId = Number(updateUserMatch[1])
      users = users.filter((item) => item.id !== selectedId)
      cvs = cvs.filter((item) => item.userId !== selectedId)
      return route.fulfill({ status: 204, body: '' })
    }

    if (method === 'GET' && pathname.endsWith('/api/admin/cv-docs')) {
      const query = (url.searchParams.get('query') ?? '').toLowerCase()
      const filtered = cvs.filter((item) =>
        matchesQuery(query, item.title, item.jdTitle ?? '', item.userEmail, item.userFullName),
      )
      return fulfillJson(route, pageOf(filtered))
    }

    const updateCvMatch = pathname.match(/\/api\/admin\/cv-docs\/(\d+)$/)
    if (method === 'PUT' && updateCvMatch) {
      const selectedId = Number(updateCvMatch[1])
      const body = parseJson(route.request().postData())
      cvs = cvs.map((item) => item.id === selectedId ? {
        ...item,
        title: body.title ?? item.title,
        templateId: body.templateId,
        fileName: body.fileName,
        downloadUrl: body.downloadUrl,
        atsScore: body.atsScore,
        jdTitle: body.jdTitle,
        isPrimary: body.isPrimary ?? item.isPrimary,
        updatedAt: NOW,
      } : item)
      const updated = cvs.find((item) => item.id === selectedId)
      return fulfillJson(route, updated)
    }

    if (method === 'DELETE' && updateCvMatch) {
      const selectedId = Number(updateCvMatch[1])
      cvs = cvs.filter((item) => item.id !== selectedId)
      return route.fulfill({ status: 204, body: '' })
    }

    // ── CV Template CRUD (UC-21a – 21d) ──────────────────────────────────
    if (method === 'GET' && pathname.endsWith('/api/admin/cv-templates')) {
      const query = (url.searchParams.get('query') ?? '').toLowerCase()
      const filtered = templates.filter((item) =>
        matchesQuery(query, item.name, item.description ?? ''),
      )
      return fulfillJson(route, pageOf(filtered))
    }

    if (method === 'POST' && pathname.endsWith('/api/admin/cv-templates')) {
      return route.fulfill({ status: 405, body: 'Method Not Allowed' })
    }

    const updateTemplateMatch = pathname.match(/\/api\/admin\/cv-templates\/(\d+)$/)
    if (method === 'PUT' && updateTemplateMatch) {
      return route.fulfill({ status: 405, body: 'Method Not Allowed' })
    }

    if (method === 'DELETE' && updateTemplateMatch) {
      const selectedId = Number(updateTemplateMatch[1])
      templates = templates.filter((item) => item.id !== selectedId)
      return route.fulfill({ status: 204, body: '' })
    }

    return route.fulfill({ status: 404, body: 'Not Found' })
  })
}

export async function mockJdSearchApi(page: Page, options?: {
  results?: JDCardResult[]
  details?: Record<string, JDFormattedDetail>
}) {
  const results = clone(options?.results ?? jdResults)
  const details = clone(options?.details ?? jdDetails)

  await page.route('**/api/jd/search', async (route) => {
    return fulfillJson(route, {
      query: parseJson(route.request().postData()).query ?? '',
      results,
    })
  })

  await page.route('**/api/jd/format', async (route) => {
    const body = parseJson(route.request().postData())
    const detail = details[body.jd_id]
    if (!detail) {
      return route.fulfill({ status: 404, body: 'Not Found' })
    }
    return fulfillJson(route, detail)
  })
}

export async function mockCvGenerationApi(page: Page, options?: {
  result?: GenerateCvResponse
  taskId?: string
}) {
  const taskId = options?.taskId ?? 'task-123'
  const result = clone(options?.result ?? generatedCvResult)
  let pollCount = 0

  await page.route('**/api/cv/generate/async', async (route) => {
    return fulfillJson(route, { task_id: taskId })
  })

  await page.route(`**/api/cv/tasks/${taskId}`, async (route) => {
    pollCount += 1
    if (pollCount < 2) {
      return fulfillJson(route, { status: 'running' })
    }
    return fulfillJson(route, { status: 'done', result })
  })

  await page.route('**/api/cv/download**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: fs.readFileSync(DOCX_FIXTURE_PATH),
    })
  })
}

export function pageOf<T>(items: T[]): PageResponse<T> {
  return {
    content: items,
    page: 0,
    size: 20,
    totalElements: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    first: true,
    last: true,
  }
}

function buildAdminStats(users: AdminUser[], cvs: AdminCvDocument[]): AdminDashboardStats {
  const now = new Date(NOW).getTime()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  return {
    totalUsers: users.length,
    totalCandidates: users.filter((item) => item.role === 'CANDIDATE').length,
    totalAdmins: users.filter((item) => item.role === 'ADMIN').length,
    activeUsers: users.filter((item) => item.isActive).length,
    inactiveUsers: users.filter((item) => !item.isActive).length,
    totalCvDocuments: cvs.length,
    cvsCreatedLast7Days: cvs.filter((item) => now - new Date(item.createdAt).getTime() <= sevenDaysMs).length,
  }
}

function nextId(ids: number[]) {
  return Math.max(...ids, 0) + 1
}

function matchesQuery(query: string, ...fields: string[]) {
  if (!query) return true
  return fields.some((field) => field.toLowerCase().includes(query))
}

function parseJson(payload: string | null | undefined): Record<string, any> {
  if (!payload) return {}
  try {
    return JSON.parse(payload)
  } catch {
    return {}
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function fulfillJson(route: { fulfill: (options: { status: number, contentType: string, body: string }) => Promise<void> }, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
