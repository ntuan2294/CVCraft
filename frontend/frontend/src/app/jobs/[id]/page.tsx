'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { jobApi, applicationApi, bookmarkApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import type { JobPost } from '@/lib/types'

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, isCandidate } = useAuth()
  const [job, setJob] = useState<JobPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showApply, setShowApply] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    jobApi.getById(Number(id)).then(j => {
      setJob(j)
      setBookmarked(j.isBookmarked)
    }).finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    if (!user) { router.push('/auth/login'); return }
    setApplying(true)
    try {
      await applicationApi.apply(Number(id), { coverLetter })
      setJob(prev => prev ? { ...prev, hasApplied: true, applicationCount: prev.applicationCount + 1 } : prev)
      setShowApply(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const toggleBookmark = async () => {
    if (!user) { router.push('/auth/login'); return }
    try {
      if (bookmarked) {
        await bookmarkApi.removeJobBookmark(Number(id))
        setBookmarked(false)
      } else {
        await bookmarkApi.bookmarkJob(Number(id))
        setBookmarked(true)
      }
    } catch {}
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl p-8 h-48 border border-gray-100" />
      <div className="bg-white rounded-2xl p-8 h-96 border border-gray-100" />
    </div>
  )

  if (!job) return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
    </div>
  )

  const salary = job.isSalaryVisible && job.salaryMin
    ? `$${(job.salaryMin / 1000).toFixed(0)}k${job.salaryMax ? `–$${(job.salaryMax / 1000).toFixed(0)}k` : '+'}/yr`
    : 'Salary not disclosed'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-5">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-2xl font-bold text-blue-600 shrink-0">
                {job.company.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-gray-500 text-sm">
                  <span className="font-medium text-gray-700">{job.company.name}</span>
                  {job.company.isVerified && <span className="text-blue-500 text-xs bg-blue-50 px-2 py-0.5 rounded-full">✓ Verified</span>}
                  <span>·</span>
                  <span>{job.location}</span>
                  <span>·</span>
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[job.jobType.replace('_', ' '), job.workMode, job.experienceLevel].map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{t}</span>
                  ))}
                  {job.category && <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{job.category}</span>}
                </div>
              </div>
              <button onClick={toggleBookmark} title={bookmarked ? 'Remove bookmark' : 'Bookmark job'}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${bookmarked ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-500'}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <Stat label="Salary" value={salary} />
              <Stat label="Vacancies" value={`${job.vacancyCount} positions`} />
              <Stat label="Applicants" value={`${job.applicationCount} applied`} />
              {job.deadline && <Stat label="Deadline" value={new Date(job.deadline).toLocaleDateString()} />}
            </div>
          </div>

          {/* Description */}
          <Section title="Job Description">
            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">{job.description}</div>
          </Section>

          {job.requirements && (
            <Section title="Requirements">
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">{job.requirements}</div>
            </Section>
          )}

          {job.benefits && (
            <Section title="Benefits">
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">{job.benefits}</div>
            </Section>
          )}

          {job.skills?.length > 0 && (
            <Section title="Required Skills">
              <div className="flex flex-wrap gap-2">
                {job.skills.map(s => (
                  <span key={s} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 shrink-0 space-y-4">
          {/* Apply Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <div className="text-center mb-5">
              <div className="text-2xl font-bold text-green-600 mb-1">{job.isSalaryVisible && job.salaryMin ? salary : 'Competitive'}</div>
              <p className="text-sm text-gray-500">{job.applicationCount} people applied</p>
            </div>

            {job.status !== 'OPEN' ? (
              <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-center text-sm font-medium">
                Position Closed
              </div>
            ) : job.hasApplied ? (
              <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl text-center text-sm font-semibold">
                ✓ Application Submitted
              </div>
            ) : showApply ? (
              <div className="space-y-3">
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Cover letter (optional)..."
                  rows={5}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
                />
                <button onClick={handleApply} disabled={applying}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 text-sm">
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button onClick={() => setShowApply(false)} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { if (!isCandidate && !user) router.push('/auth/login'); else setShowApply(true) }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm">
                Apply Now
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">About the Company</h4>
              <div className="text-sm text-gray-700 font-medium mb-1">{job.company.name}</div>
              {job.company.location && <div className="text-xs text-gray-500">{job.company.location}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}
