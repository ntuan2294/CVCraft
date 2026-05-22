// ---- Auth Types ----
export type UserRole = 'CANDIDATE' | 'ADMIN'
export type ExperienceLevel = 'INTERN' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  avatarUrl?: string
  role: UserRole
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

// ---- User CV Profile ----
export interface UserProfile {
  id: number
  userId: number
  fullName: string
  email: string
  avatarUrl?: string
  headline?: string
  bio?: string
  location?: string
  experienceYears?: number
  experienceLevel?: ExperienceLevel
  skills: string[]
  cvUrl?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  workExperiences?: string
  educations?: string
  certifications?: string
  createdAt: string
}

// ---- CV Library ----
export interface CvDocument {
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

// ---- Pagination ----
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

// ---- Admin ----
export interface AdminDashboardStats {
  totalUsers: number
  totalCandidates: number
  totalAdmins: number
  activeUsers: number
  inactiveUsers: number
  totalCvDocuments: number
  cvsCreatedLast7Days: number
}

export interface AdminUser {
  id: number
  email: string
  fullName: string
  phone?: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  cvCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminCvDocument {
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

// ---- JD Search types ----
export interface JDRewrittenSections {
  job_description: string[]
  requirements: string[]
  benefits: string[]
}

export interface JDDocument {
  id: string
  title: string
  company?: string
  industry?: string
  seniority?: string
  description: string
  required_skills: string[]
  keywords: string[]
  details?: Record<string, string>
  rewritten_sections?: JDRewrittenSections
  description_bullets?: string[]
  requirements_bullets?: string[]
  benefits_bullets?: string[]
}

export interface JDSearchResult {
  jd: JDDocument
  similarity_score: number
}

export interface JDSearchResponse {
  query: string
  top_jds: JDSearchResult[]
}

export interface JDCardResult {
  id: string
  title: string
  company?: string
  industry?: string
  seniority?: string
  similarity_score: number
}

export interface JDSearchCardResponse {
  query: string
  results: JDCardResult[]
}

export interface JDFormattedDetail {
  id: string
  description_bullets: string[]
  requirements_bullets: string[]
  benefits_bullets: string[]
  quick_info: Record<string, string>
}

export interface JDSearchRequest {
  query: string
}

// ---- CV Generation types ----
export interface WorkExperience {
  company: string
  position: string
  start_date: string
  end_date?: string
  description: string
}

export interface Education {
  school: string
  degree: string
  major: string
  start_date: string
  end_date?: string
  gpa?: number
}

export interface Project {
  name: string
  description: string
  link?: string
  start_date?: string
  end_date?: string
  tech_stack?: string[]
}

export interface Certification {
  name: string
  issuer?: string
  date?: string
  link?: string
}

export interface UserInput {
  full_name: string
  email: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  job_title?: string
  summary?: string
  work_experiences: WorkExperience[]
  educations: Education[]
  skills: string[]
  languages?: string[]
  references?: string
  certifications: Certification[]
  projects: Project[]
  template_path?: string
  template_id?: string
  template_schema?: CVTemplateSchema
  photo?: UploadedPhoto
  output_language?: 'vi' | 'en'
  export_format?: 'docx' | 'pdf' | 'html'
}

export interface UploadedPhoto {
  file_name: string
  content_type: string
  data_url: string
}

export interface CVTemplateSchema {
  id: string
  summary_field: 'profile' | 'about_me' | 'personal_summary' | 'summary'
  fields: string[]
  supports_photo_upload: boolean
  instruction: string
}

export interface QualityScore {
  ats_score: number
  jd_match_score: number
  linguistic_score: number
  overall_score: number
  feedback: string[]
  needs_revision: boolean
}

export interface GenerateCVResponse {
  status: string
  output_path?: string
  quality_score?: QualityScore
  cv_draft?: {
    summary?: string
    experiences?: Array<{
      company: string
      position: string
      start_date: string
      end_date?: string
      raw_description?: string
      bullets?: string[]
    }>
    skills_categorized?: Record<string, string[]>
    educations?: Education[]
  }
  messages: string[]
}
