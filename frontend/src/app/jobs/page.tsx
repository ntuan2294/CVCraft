'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { jobApi } from '@/lib/backendApi'
import type { JobPost, JobType, ExperienceLevel, WorkMode, PageResponse } from '@/lib/types'

const JOB_TYPES: JobType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']
const EXP_LEVELS: ExperienceLevel[] = ['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR']
const WORK_MODES: WorkMode[] = ['ONSITE', 'REMOTE', 'HYBRID']

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsPageSkeleton />}>
      <JobsContent />
    </Suspense>
  )
}

function JobsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [result, setResult] = useState<PageResponse<JobPost> | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [jobType, setJobType] = useState(searchParams.get('jobType') ?? '')
  const [expLevel, setExpLevel] = useState(searchParams.get('experienceLevel') ?? '')
  const [workMode, setWorkMode] = useState(searchParams.get('workMode') ?? '')
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salaryMin') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest')
  const [page, setPage] = useState(0)

  useEffect(() => { jobApi.getCategories().then(setCategories).catch(() => {}) }, [])

  const search = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const data = await jobApi.search({
        keyword: keyword || undefined,
        location: location || undefined,
        category: category || undefined,
        jobType: (jobType as JobType) || undefined,
        experienceLevel: (expLevel as ExperienceLevel) || undefined,
        workMode: (workMode as WorkMode) || undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        sort,
        page: p,
        size: 12,
      })
      setResult(data)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [keyword, location, category, jobType, expLevel, workMode, salaryMin, sort])

  useEffect(() => { search(0) }, [search])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); search(0) }

  const clearFilters = () => {
    setCategory(''); setJobType(''); setExpLevel(''); setWorkMode(''); setSalaryMin('')
    setTimeout(() => search(0), 0)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="Job title, skills, or company" className="w-full text-sm focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 sm:w-48">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Location" className="w-full text-sm focus:outline-none" />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
          Search
        </button>
      </form>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-700">Clear all</button>
            </div>

            <FilterSection title="Category">
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FilterSection>

            <FilterSection title="Job Type">
              {JOB_TYPES.map(t => (
                <FilterCheckbox key={t} label={t.replace('_', ' ')} checked={jobType === t} onChange={v => setJobType(v ? t : '')} />
              ))}
            </FilterSection>

            <FilterSection title="Experience Level">
              {EXP_LEVELS.map(l => (
                <FilterCheckbox key={l} label={l} checked={expLevel === l} onChange={v => setExpLevel(v ? l : '')} />
              ))}
            </FilterSection>

            <FilterSection title="Work Mode">
              {WORK_MODES.map(m => (
                <FilterCheckbox key={m} label={m} checked={workMode === m} onChange={v => setWorkMode(v ? m : '')} />
              ))}
            </FilterSection>

            <FilterSection title="Min Salary (USD/yr)">
              <select value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Any</option>
                {[30000, 50000, 80000, 100000, 150000, 200000].map(s => (
                  <option key={s} value={s}>${(s / 1000).toFixed(0)}k+</option>
                ))}
              </select>
            </FilterSection>
          </div>
        </aside>

        {/* Job List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {result ? `${result.totalElements.toLocaleString()} jobs found` : 'Loading...'}
            </p>
            <select value={sort} onChange={e => { setSort(e.target.value); search(0) }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400">
              <option value="newest">Newest first</option>
              <option value="popular">Most popular</option>
              <option value="salary_desc">Salary: High to Low</option>
              <option value="salary_asc">Salary: Low to High</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : result?.content.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-3">
              {result?.content.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}

          {/* Pagination */}
          {result && result.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => search(page - 1)} disabled={result.first}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                ← Prev
              </button>
              {Array.from({ length: Math.min(result.totalPages, 5) }).map((_, i) => {
                const pageNum = Math.max(0, page - 2) + i
                if (pageNum >= result.totalPages) return null
                return (
                  <button key={pageNum} onClick={() => search(pageNum)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${pageNum === page ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}>
                    {pageNum + 1}
                  </button>
                )
              })}
              <button onClick={() => search(page + 1)} disabled={result.last}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function JobCard({ job }: { job: JobPost }) {
  const salary = job.isSalaryVisible && job.salaryMin
    ? `$${(job.salaryMin / 1000).toFixed(0)}k${job.salaryMax ? `–$${(job.salaryMax / 1000).toFixed(0)}k` : '+'}`
    : null

  return (
    <Link href={`/jobs/${job.id}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 flex gap-4 group block">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-xl font-bold text-blue-600 shrink-0">
        {job.company.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <span>{job.company.name}</span>
              {job.company.isVerified && <span className="text-blue-500 text-xs">✓ Verified</span>}
              <span className="text-gray-300">·</span>
              <span>{job.location}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {salary && <span className="text-sm font-semibold text-green-600">{salary}</span>}
            {job.hasApplied && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Applied</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Tag color="blue">{job.workMode}</Tag>
          <Tag color="gray">{job.jobType.replace('_', ' ')}</Tag>
          <Tag color="gray">{job.experienceLevel}</Tag>
          {job.skills?.slice(0, 3).map(s => <Tag key={s} color="gray">{s}</Tag>)}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>{job.applicationCount} applicants</span>
          <span>·</span>
          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
          {job.deadline && <><span>·</span><span className="text-orange-500">Closes {new Date(job.deadline).toLocaleDateString()}</span></>}
        </div>
      </div>
    </Link>
  )
}

function Tag({ children, color }: { children: React.ReactNode; color: 'blue' | 'gray' }) {
  const cls = color === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{children}</span>
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
  )
}

function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 animate-pulse">
      <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

function JobsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse mb-6" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-64 bg-white rounded-2xl border border-gray-100 h-96 animate-pulse shrink-0" />
        <div className="flex-1 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}
