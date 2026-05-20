'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { applicationApi, candidateApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import type { ApplicationItem, CandidateProfile, ApplicationStatus, PageResponse } from '@/lib/types'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING:    { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  REVIEWING:  { label: 'Reviewing',   color: 'bg-blue-100 text-blue-700' },
  SHORTLISTED:{ label: 'Shortlisted', color: 'bg-violet-100 text-violet-700' },
  INTERVIEW:  { label: 'Interview',   color: 'bg-purple-100 text-purple-700' },
  OFFERED:    { label: 'Offered!',    color: 'bg-green-100 text-green-700' },
  HIRED:      { label: 'Hired! 🎉',   color: 'bg-green-200 text-green-800' },
  REJECTED:   { label: 'Rejected',    color: 'bg-red-100 text-red-700' },
  WITHDRAWN:  { label: 'Withdrawn',   color: 'bg-gray-100 text-gray-600' },
}

export default function CandidateDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [applications, setApplications] = useState<PageResponse<ApplicationItem> | null>(null)
  const [appPage, setAppPage] = useState(0)
  const [tab, setTab] = useState<'overview' | 'applications' | 'profile'>('overview')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
    if (user?.role !== 'CANDIDATE' && user) router.push('/dashboard/recruiter')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    candidateApi.getMe().then(setProfile).catch(() => {})
    applicationApi.getMyApplications(0).then(setApplications).catch(() => {})
  }, [user])

  useEffect(() => {
    if (tab === 'applications') {
      applicationApi.getMyApplications(appPage).then(setApplications).catch(() => {})
    }
  }, [tab, appPage])

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  const statusCounts = applications?.content.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user.fullName.split(' ')[0]}!</p>
        </div>
        <div className="flex gap-3">
          <Link href="/cv/generate" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            ✨ Build CV
          </Link>
          <Link href="/jobs" className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['overview', 'applications', 'profile'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Profile Completion */}
          {profile && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                  <p className="text-sm text-gray-500">{profile.headline ?? 'No headline yet'}</p>
                  {profile.isOpenToWork
                    ? <span className="inline-block mt-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">🟢 Open to work</span>
                    : <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Not looking</span>
                  }
                </div>
                <Link href="/profile" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Edit Profile →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900">{profile.profileViews}</div>
                  <div className="text-xs text-gray-500">Profile Views</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{applications?.totalElements ?? 0}</div>
                  <div className="text-xs text-gray-500">Applications</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{profile.skills?.length ?? 0}</div>
                  <div className="text-xs text-gray-500">Skills Listed</div>
                </div>
              </div>
            </div>
          )}

          {/* Application Status Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Application Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { status: 'PENDING', icon: '⏳' },
                { status: 'INTERVIEW', icon: '📅' },
                { status: 'OFFERED', icon: '🎁' },
                { status: 'HIRED', icon: '🎉' },
              ].map(({ status, icon }) => (
                <div key={status} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xl font-bold text-gray-900">{statusCounts[status] ?? 0}</div>
                  <div className="text-xs text-gray-500">{STATUS_CONFIG[status as ApplicationStatus]?.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Applications */}
          {applications && applications.content.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Applications</h3>
                <button onClick={() => setTab('applications')} className="text-sm text-blue-600 hover:text-blue-700">View all</button>
              </div>
              <div className="space-y-3">
                {applications.content.slice(0, 4).map(app => (
                  <ApplicationRow key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">All Applications ({applications?.totalElements ?? 0})</h3>
          {applications?.content.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-gray-500">No applications yet</p>
              <Link href="/jobs" className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">Browse jobs →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications?.content.map(app => <ApplicationRow key={app.id} app={app} extended />)}
            </div>
          )}
          {applications && applications.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setAppPage(p => p - 1)} disabled={applications.first}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <button onClick={() => setAppPage(p => p + 1)} disabled={applications.last}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Profile Details</h3>
          <p className="text-gray-500 text-sm mb-4">Keep your profile up to date to attract recruiters.</p>
          <Link href="/profile" className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors inline-block">
            Edit Full Profile
          </Link>
        </div>
      )}
    </div>
  )
}

function ApplicationRow({ app, extended = false }: { app: ApplicationItem; extended?: boolean }) {
  const cfg = STATUS_CONFIG[app.status]
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
        {app.job.companyName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{app.job.title}</div>
        <div className="text-xs text-gray-500">{app.job.companyName} · {app.job.location}</div>
        {extended && app.interviewDate && (
          <div className="text-xs text-purple-600 mt-0.5">📅 Interview: {new Date(app.interviewDate).toLocaleDateString()}</div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
        <span className="text-xs text-gray-400">{new Date(app.appliedAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
