'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { candidateApi, bookmarkApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import type { CandidateProfile, ExperienceLevel, WorkMode, PageResponse } from '@/lib/types'

const EXP_LEVELS: ExperienceLevel[] = ['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR']
const WORK_MODES: WorkMode[] = ['ONSITE', 'REMOTE', 'HYBRID']

export default function CandidatesPage() {
  const { user } = useAuth()
  const [result, setResult] = useState<PageResponse<CandidateProfile> | null>(null)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [expLevel, setExpLevel] = useState('')
  const [workMode, setWorkMode] = useState('')
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [openToWork, setOpenToWork] = useState(false)
  const [page, setPage] = useState(0)

  const search = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const data = await candidateApi.search({
        keyword: keyword || undefined,
        location: location || undefined,
        experienceLevel: expLevel || undefined,
        workMode: workMode || undefined,
        minExp: minExp ? Number(minExp) : undefined,
        maxExp: maxExp ? Number(maxExp) : undefined,
        isOpenToWork: openToWork || undefined,
        page: p,
        size: 12,
      })
      setResult(data)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [keyword, location, expLevel, workMode, minExp, maxExp, openToWork])

  useEffect(() => { search(0) }, [search])

  const handleBookmark = async (candidateId: number, isBookmarked: boolean) => {
    if (!user) return
    try {
      if (isBookmarked) {
        await bookmarkApi.removeCandidate(candidateId)
      } else {
        await bookmarkApi.bookmarkCandidate(candidateId)
      }
      setResult(prev => prev ? {
        ...prev,
        content: prev.content.map(c => c.userId === candidateId ? { ...c, isBookmarked: !isBookmarked } : c)
      } : prev)
    } catch {}
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Candidates</h1>
        <p className="text-gray-500 text-sm">Find top talent across all industries and experience levels</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(0)}
            placeholder="Skills, job title, or keywords" className="w-full text-sm focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 sm:w-44">
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(0)}
            placeholder="Location" className="w-full text-sm focus:outline-none" />
        </div>
        <button onClick={() => search(0)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
          Search
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={openToWork} onChange={e => setOpenToWork(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Open to work only</span>
              </label>
            </div>

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

            <FilterSection title="Years of Experience">
              <div className="flex gap-2">
                <input type="number" value={minExp} onChange={e => setMinExp(e.target.value)}
                  placeholder="Min" min="0" max="50"
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                <input type="number" value={maxExp} onChange={e => setMaxExp(e.target.value)}
                  placeholder="Max" min="0" max="50"
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400" />
              </div>
            </FilterSection>
          </div>
        </aside>

        {/* Candidates Grid */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">
            {result ? `${result.totalElements.toLocaleString()} candidates found` : 'Loading...'}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <CandidateCardSkeleton key={i} />)}
            </div>
          ) : result?.content.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {result?.content.map(c => (
                <CandidateCard key={c.id} candidate={c} onBookmark={handleBookmark} isRecruiter={user?.role === 'RECRUITER'} />
              ))}
            </div>
          )}

          {result && result.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => search(page - 1)} disabled={result.first}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-500">Page {page + 1} of {result.totalPages}</span>
              <button onClick={() => search(page + 1)} disabled={result.last}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CandidateCard({ candidate, onBookmark, isRecruiter }: {
  candidate: CandidateProfile
  onBookmark: (id: number, current: boolean) => void
  isRecruiter: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 relative group">
      {isRecruiter && (
        <button onClick={() => onBookmark(candidate.userId, candidate.isBookmarked)}
          className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${candidate.isBookmarked ? 'bg-blue-50 text-blue-600' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={candidate.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
          {candidate.fullName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/candidates/${candidate.id}`}
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block">
            {candidate.fullName}
          </Link>
          {candidate.headline && <p className="text-xs text-gray-500 truncate">{candidate.headline}</p>}
        </div>
      </div>

      <div className="space-y-1 mb-4 text-sm text-gray-600">
        {candidate.location && (
          <div className="flex items-center gap-1.5 text-xs">
            <span>📍</span> {candidate.location}
          </div>
        )}
        {candidate.experienceYears !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            <span>⏱</span> {candidate.experienceYears} years experience
          </div>
        )}
        {candidate.desiredWorkMode && (
          <div className="flex items-center gap-1.5 text-xs">
            <span>🖥</span> Prefers {candidate.desiredWorkMode}
          </div>
        )}
      </div>

      {candidate.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {candidate.skills.slice(0, 4).map(s => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {candidate.skills.length > 4 && (
            <span className="text-xs text-gray-400">+{candidate.skills.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {candidate.isOpenToWork
          ? <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">🟢 Open to work</span>
          : <span className="text-xs text-gray-400">Not actively looking</span>
        }
        <Link href={`/candidates/${candidate.id}`}
          className="text-xs font-medium text-blue-600 hover:text-blue-700">
          View Profile →
        </Link>
      </div>
    </div>
  )
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
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

function CandidateCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded w-4/5" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 bg-gray-100 rounded-full w-12" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-14" />
      </div>
    </div>
  )
}
