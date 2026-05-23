'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cvDocumentApi, profileApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'
import type { CvDocument, UserProfile, PageResponse } from '@/lib/types'
import { downloadCvFileAsPdf } from '@/features/generate-cv/utils/export'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export default function Dashboard() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [cvDocs, setCvDocs] = useState<PageResponse<CvDocument> | null>(null)
  const [tab, setTab] = useState<'cvs' | 'profile'>('cvs')
  const [deleting, setDeleting] = useState<number | null>(null)
  
  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'ats'>('newest')
  const [filterTemplate, setFilterTemplate] = useState('all')

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([])

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null)

  // Loading more state
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    profileApi.getMe().then(setProfile).catch(() => { })
    cvDocumentApi.getMyCvs().then(setCvDocs).catch(() => { })
  }, [user])

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await cvDocumentApi.deleteCv(id)
      setCvDocs(prev => prev ? {
        ...prev,
        content: prev.content.filter(c => c.id !== id),
        totalElements: prev.totalElements - 1,
      } : prev)
      showToast(t('dash.deleteSuccess'), 'success')
    } catch {
      showToast(t('dash.deleteError'), 'error')
    }
    setDeleting(null)
    setDeleteTarget(null)
  }

  const handleSetPrimary = async (id: number, title: string) => {
    try {
      const updated = await cvDocumentApi.setPrimary(id)
      setCvDocs(prev => prev ? {
        ...prev,
        content: prev.content.map(c => ({
          ...c,
          isPrimary: c.id === updated.id ? updated.isPrimary : false
        }))
      } : prev)
    } catch {
      showToast(t('dash.setPrimaryError'), 'error')
    }
  }

  const handleLoadMore = async () => {
    if (!cvDocs || cvDocs.last || loadingMore) return
    setLoadingMore(true)
    try {
      const nextPage = cvDocs.page + 1
      const res = await cvDocumentApi.getMyCvs(nextPage, cvDocs.size)
      setCvDocs(prev => prev ? {
        ...res,
        content: [...prev.content, ...res.content]
      } : res)
    } catch {
      showToast(t('dash.deleteError'), 'error')
    } finally {
      setLoadingMore(false)
    }
  }

  // Extract templates for filter options
  const templates = Array.from(new Set(cvDocs?.content.map(c => c.templateId).filter(Boolean))) as string[]

  const getTemplateName = (id?: string) => {
    if (!id) return ''
    const numMatch = id.match(/\d+/)
    const num = numMatch ? numMatch[0] : id
    const key = `tpl.${num}.name` as any
    const name = t(key)
    if (name !== key) return name

    const names: Record<string, string> = {
      '1': 'Classic',
      '2': 'Modern',
      '3': 'Minimalist',
      '4': 'Creative',
      '5': 'Professional',
    }
    return `Template ${num} (${names[num] || id})`
  }

  // Filtered & Sorted CVs
  const filteredCvs = (cvDocs?.content || [])
    .filter(cv => {
      const matchesSearch = cv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cv.jdTitle && cv.jdTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesTemplate = filterTemplate === 'all' || cv.templateId === filterTemplate
      return matchesSearch && matchesTemplate
    })
    .sort((a, b) => {
      if (sortBy === 'ats') {
        return (b.atsScore ?? 0) - (a.atsScore ?? 0)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('dash.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('dash.welcome', { name: user.fullName.split(' ')[0] })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: t('dash.savedCvs'),
            value: cvDocs?.totalElements ?? 0,
            color: 'text-blue-600 bg-blue-50 border-blue-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
          {
            label: t('dash.bestAtsScore'),
            value: cvDocs?.content.reduce((max, c) => Math.max(max, c.atsScore ?? 0), 0) ?? 0,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: t('dash.skillsListed'),
            value: profile?.skills?.length ?? 0,
            color: 'text-purple-600 bg-purple-50 border-purple-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
          },
          {
            label: t('dash.profileComplete'),
            value: profile ? `${calcCompletion(profile)}%` : '0%',
            color: 'text-orange-600 bg-orange-50 border-orange-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
          },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-2xl bg-gray-100 p-1">
        {(['cvs', 'profile'] as const).map(tName => (
          <button key={tName} type="button" onClick={() => setTab(tName)}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === tName ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}>
            {tName === 'cvs' ? t('dash.myCvs') : t('dash.profile')}
          </button>
        ))}
      </div>

      {tab === 'cvs' && (
        <div>
          {!cvDocs || cvDocs.content.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dash.noCvsYet')}</h3>
              <p className="text-gray-500 text-sm mb-6">{t('dash.noCvsDesc')}</p>
              <Link href="/cv/generate" className="inline-block rounded-2xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                {t('dash.buildFirstCv')}
              </Link>
            </div>
          ) : (
            <>
              {/* Search, Filter, Sort bar */}
              <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder={t('dash.searchPlaceholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-800"
                  />
                </div>
                
                <div className="flex gap-2">
                  {/* Filter Template */}
                  <select
                    value={filterTemplate}
                    onChange={e => setFilterTemplate(e.target.value)}
                    className="px-3 py-2 text-xs bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 cursor-pointer font-semibold"
                  >
                    <option value="all">{t('dash.filterTemplate')}</option>
                    {templates.map(tplId => (
                      <option key={tplId} value={tplId}>
                        {getTemplateName(tplId)}
                      </option>
                    ))}
                  </select>

                  {/* Sort options */}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'newest' | 'ats')}
                    className="px-3 py-2 text-xs bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 cursor-pointer font-semibold"
                  >
                    <option value="newest">{t('dash.sortNewest')}</option>
                    <option value="ats">{t('dash.sortAts')}</option>
                  </select>
                </div>
              </div>

              {/* Grid CV Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCvs.map(cv => (
                  <CvCard
                    key={cv.id}
                    cv={cv}
                    onDelete={(id, title) => setDeleteTarget({ id, title })}
                    onSetPrimary={handleSetPrimary}
                    deleting={deleting === cv.id}
                    showToast={showToast}
                    getTemplateName={getTemplateName}
                  />
                ))}
                {/* Add new card */}
                <Link href="/cv/generate"
                  className="flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-white p-6 transition-all group hover:border-blue-300 hover:bg-blue-50/50 shadow-sm hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 transition-colors group-hover:bg-blue-200">
                    <span className="text-2xl text-blue-600">+</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 transition-colors group-hover:text-blue-600">{t('dash.createNewCv')}</span>
                </Link>
              </div>

              {/* Phân trang "Load More" */}
              {cvDocs && !cvDocs.last && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="rounded-2xl border border-gray-200 bg-white px-8 py-3 text-xs font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                    ) : null}
                    {t('dash.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('dash.cvProfile')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('dash.prefillHint')}</p>
            </div>
          </div>
          {profile ? (
            <div className="space-y-4">
              <ProfileField label="Headline" value={profile.headline} />
              <ProfileField label="Location" value={profile.location} />
              <ProfileField label="Experience" value={profile.experienceYears ? `${profile.experienceYears} years` : null} />
              <ProfileField label="Skills" value={profile.skills?.join(', ')} />
              <ProfileField label="LinkedIn" value={profile.linkedinUrl} />
              <ProfileField label="GitHub" value={profile.githubUrl} />
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading profile...</p>
          )}
          <Link href="/profile" className="mt-6 inline-block rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
            {t('dash.editFullProfile')}
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={deleteTarget.title}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting === deleteTarget.id}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

function CvCard({
  cv,
  onDelete,
  onSetPrimary,
  deleting,
  showToast,
  getTemplateName,
}: {
  cv: CvDocument
  onDelete: (id: number, title: string) => void
  onSetPrimary: (id: number, title: string) => void
  deleting: boolean
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  getTemplateName: (id?: string) => string
}) {
  const { t } = useI18n()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const handleDownloadDocx = () => {
    setDropdownOpen(false)
    if (!cv.downloadUrl) return
    const a = document.createElement('a')
    a.href = cv.downloadUrl
    a.download = `${cv.title.replace(/[\s\/:*?"<>|]+/g, '_')}.docx`
    a.click()
  }

  const handleDownloadPdf = async () => {
    setDropdownOpen(false)
    if (!cv.downloadUrl) return
    setDownloadingPdf(true)
    try {
      await downloadCvFileAsPdf(cv.downloadUrl, cv.title)
      showToast(t('gen.saved'), 'success')
    } catch {
      showToast(t('dash.deleteError'), 'error')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const renderAtsCircle = (score?: number) => {
    if (score == null) return null
    const radius = 16
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (Math.min(score, 100) / 100) * circumference
    
    let colorClass = 'stroke-red-500'
    if (score >= 80) colorClass = 'stroke-emerald-500'
    else if (score >= 60) colorClass = 'stroke-yellow-500'
    
    return (
      <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-gray-100 fill-transparent"
            strokeWidth="3.5"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            className={`${colorClass} fill-transparent transition-all duration-500 ease-out`}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold text-gray-800 leading-none">{score}</span>
          <span className="text-[7px] text-gray-400 font-extrabold uppercase leading-none mt-0.5">ATS</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <h3 className="font-bold text-gray-900 truncate max-w-[140px] sm:max-w-none" title={cv.title}>{cv.title}</h3>
              {cv.isPrimary && (
                <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                  {t('dash.primary')}
                </span>
              )}
            </div>
            {cv.jdTitle && (
              <p className="mt-1 text-xs text-gray-500 truncate" title={`For: ${cv.jdTitle}`}>
                For: {cv.jdTitle}
              </p>
            )}
          </div>
          {renderAtsCircle(cv.atsScore)}
        </div>

        <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
          {cv.templateId && <span className="font-semibold text-gray-500">{getTemplateName(cv.templateId)}</span>}
          <span>{t('dash.updatedAt', { date: new Date(cv.updatedAt || cv.createdAt).toLocaleDateString() })}</span>
        </div>
      </div>

      <div className="flex gap-2 border-t border-gray-50 pt-3 relative">
        {cv.downloadUrl && (
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-center gap-1 rounded-2xl border border-blue-100 py-2 text-center text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
            >
              {downloadingPdf ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  {t('dash.downloadingPdf')}
                </>
              ) : (
                <>
                  {t('dash.download')}
                  <span className="text-[9px]">▼</span>
                </>
              )}
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 bottom-full z-20 mb-2 w-36 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-lg animate-fade-in">
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    className="flex w-full items-center px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    📄 {t('dash.downloadDocx')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex w-full items-center px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    📑 {t('dash.downloadPdf')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="relative flex-1 group/tooltip">
          <button
            type="button"
            onClick={() => onSetPrimary(cv.id, cv.title)}
            className="w-full rounded-2xl border border-gray-100 py-2 text-center text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            {cv.isPrimary ? t('dash.unsetPrimary') : t('dash.setPrimary')}
          </button>
          <div className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 scale-0 rounded-xl bg-gray-900/90 backdrop-blur-sm p-2 text-center text-[10px] leading-relaxed font-semibold text-white shadow-lg transition-all group-hover/tooltip:scale-100">
            {cv.isPrimary ? t('dash.unsetPrimaryTooltip') : t('dash.primaryTooltip')}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(cv.id, cv.title)}
          disabled={deleting}
          className="rounded-2xl border border-red-50 px-3.5 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
        >
          {deleting ? t('dash.deleting') : t('dash.delete')}
        </button>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({
  title,
  onConfirm,
  onCancel,
  loading
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-gray-100 animate-scale-in">
        <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
          <span className="text-red-500">🗑</span> {t('dash.deleteConfirmTitle')}
        </h3>
        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
          {t('dash.deleteConfirmDesc', { title })}
        </p>
        <div className="mt-6 flex justify-end gap-3.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-gray-100 px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('dash.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {t('dash.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-lg border text-xs font-semibold transition-all duration-300 transform translate-y-0 ${
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : t.type === 'error'
              ? 'bg-red-50 border-red-100 text-red-800'
              : 'bg-blue-50 border-blue-100 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <span>{t.message}</span>
          </div>
          <button type="button" onClick={() => onRemove(t.id)} className="text-gray-400 hover:text-gray-600 transition-colors text-[10px]">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-4">
      <span className="text-sm text-gray-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function calcCompletion(p: UserProfile): number {
  const fields = [p.headline, p.bio, p.location, p.experienceYears, p.skills?.length, p.linkedinUrl]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}
