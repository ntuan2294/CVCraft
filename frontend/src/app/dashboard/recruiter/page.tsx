'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { jobApi, applicationApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import type { JobPost, ApplicationItem, ApplicationStatus, PageResponse } from '@/lib/types'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  REVIEWING:  'bg-blue-100 text-blue-700',
  SHORTLISTED:'bg-violet-100 text-violet-700',
  INTERVIEW:  'bg-purple-100 text-purple-700',
  OFFERED:    'bg-green-100 text-green-700',
  HIRED:      'bg-green-200 text-green-800',
  REJECTED:   'bg-red-100 text-red-700',
  WITHDRAWN:  'bg-gray-100 text-gray-600',
}

export default function RecruiterDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<PageResponse<JobPost> | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [applications, setApplications] = useState<PageResponse<ApplicationItem> | null>(null)
  const [tab, setTab] = useState<'jobs' | 'applications'>('jobs')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
    if (user?.role === 'CANDIDATE') router.push('/dashboard/candidate')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    jobApi.getMyJobs().then(setJobs).catch(() => {})
  }, [user])

  useEffect(() => {
    if (selectedJobId !== null) {
      applicationApi.getJobApplications(selectedJobId).then(setApplications).catch(() => {})
    }
  }, [selectedJobId])

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  const handleStatusUpdate = async (appId: number, status: string) => {
    try {
      const updated = await applicationApi.updateStatus(appId, status)
      setApplications(prev => prev ? {
        ...prev,
        content: prev.content.map(a => a.id === appId ? { ...a, status: updated.status } : a)
      } : prev)
    } catch {}
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your job posts and applications</p>
        </div>
        <div className="flex gap-3">
          <Link href="/candidates" className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50">
            Browse Candidates
          </Link>
          <Link href="/jobs/post" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700">
            + Post Job
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Jobs', value: jobs?.content.filter(j => j.status === 'OPEN').length ?? 0, icon: '💼' },
          { label: 'Total Jobs', value: jobs?.totalElements ?? 0, icon: '📋' },
          { label: 'Total Views', value: jobs?.content.reduce((a, j) => a + j.viewCount, 0) ?? 0, icon: '👁' },
          { label: 'Applications', value: jobs?.content.reduce((a, j) => a + j.applicationCount, 0) ?? 0, icon: '📄' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['jobs', 'applications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'jobs' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">My Job Posts ({jobs?.totalElements ?? 0})</h3>
          </div>
          {jobs?.content.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 mb-4">No job posts yet</p>
              <Link href="/jobs/post" className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700">Post Your First Job</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs?.content.map(job => (
                <div key={job.id} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{job.title}</Link>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{job.location} · {job.jobType.replace('_', ' ')}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{job.viewCount} views</span>
                      <span>·</span>
                      <span>{job.applicationCount} applicants</span>
                      <span>·</span>
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setSelectedJobId(job.id); setTab('applications') }}
                      className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                      View Apps ({job.applicationCount})
                    </button>
                    <select onChange={e => jobApi.updateStatus(job.id, e.target.value).then(() => jobApi.getMyJobs().then(setJobs))}
                      defaultValue={job.status}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400">
                      <option value="OPEN">Open</option>
                      <option value="PAUSED">Paused</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-4">
          {/* Job Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Select job:</span>
              <select value={selectedJobId ?? ''} onChange={e => setSelectedJobId(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400">
                <option value="">-- Select a job --</option>
                {jobs?.content.map(j => <option key={j.id} value={j.id}>{j.title} ({j.applicationCount})</option>)}
              </select>
            </div>
          </div>

          {selectedJobId && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Applications ({applications?.totalElements ?? 0})</h3>
                <select onChange={e => applicationApi.getJobApplications(selectedJobId, e.target.value || undefined).then(setApplications)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                  <option value="">All statuses</option>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {applications?.content.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No applications yet for this job</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {applications?.content.map(app => (
                    <div key={app.id} className="flex items-center gap-4 p-5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {app.candidate.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/candidates/${app.candidate.id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">{app.candidate.fullName}</Link>
                        {app.candidate.headline && <div className="text-xs text-gray-500 truncate">{app.candidate.headline}</div>}
                        <div className="text-xs text-gray-400 mt-0.5">Applied {new Date(app.appliedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                        <select value={app.status} onChange={e => handleStatusUpdate(app.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-gray-100 text-gray-600',
    DRAFT: 'bg-blue-100 text-blue-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>
}
