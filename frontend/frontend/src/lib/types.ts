// ---- Java Backend Platform Types ----
export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN'
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP'
export type ExperienceLevel = 'INTERN' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR'
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID'
export type JobStatus = 'OPEN' | 'PAUSED' | 'CLOSED' | 'DRAFT'
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN'

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

export interface Company {
  id: number
  name: string
  slug: string
  description?: string
  industry?: string
  size?: string
  website?: string
  location?: string
  logoUrl?: string
  coverUrl?: string
  foundedYear?: number
  isVerified: boolean
}

export interface JobPost {
  id: number
  title: string
  description: string
  requirements?: string
  benefits?: string
  location: string
  jobType: JobType
  experienceLevel: ExperienceLevel
  workMode: WorkMode
  salaryMin?: number
  salaryMax?: number
  salaryCurrency: string
  isSalaryVisible: boolean
  category?: string
  skills: string[]
  deadline?: string
  vacancyCount: number
  status: JobStatus
  viewCount: number
  applicationCount: number
  company: {
    id: number
    name: string
    slug: string
    logoUrl?: string
    location?: string
    isVerified: boolean
  }
  recruiter: { id: number; fullName: string; avatarUrl?: string }
  createdAt: string
  isBookmarked: boolean
  hasApplied: boolean
}

export interface CandidateProfile {
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
  desiredSalaryMin?: number
  desiredSalaryMax?: number
  desiredWorkMode?: WorkMode
  cvUrl?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  isOpenToWork: boolean
  profileViews: number
  workExperiences?: string
  educations?: string
  certifications?: string
  createdAt: string
  isBookmarked: boolean
}

export interface ApplicationItem {
  id: number
  job: { id: number; title: string; location: string; companyName: string; companyLogo?: string }
  candidate: { id: number; fullName: string; email: string; avatarUrl?: string; headline?: string }
  cvUrl?: string
  coverLetter?: string
  status: ApplicationStatus
  recruiterNote?: string
  interviewDate?: string
  appliedAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface JobSearchParams {
  keyword?: string
  location?: string
  category?: string
  jobType?: JobType
  experienceLevel?: ExperienceLevel
  workMode?: WorkMode
  salaryMin?: number
  page?: number
  size?: number
  sort?: string
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

export interface JDSearchRequest {
  query: string
}

// CV Generation types
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
  export_format?: 'docx' | 'pdf'
}

export interface UploadedPhoto {
  file_name: string
  content_type: string
  data_url: string
}

export interface CVTemplateSchema {
  id: '1' | '2' | '3' | '4' | '5'
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
