'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cvDocumentApi, profileApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'
import type { CvDocument, UserProfile, PageResponse } from '@/lib/types'

export default function Dashboard() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [cvDocs, setCvDocs] = useState<PageResponse<CvDocument> | null>(null)
  const [tab, setTab] = useState<'cvs' | 'profile'>('cvs')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
    if (!authLoading && user?.role === 'ADMIN') router.replace('/dashboard/admin')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    if (user.role === 'ADMIN') return
    profileApi.getMe().then(setProfile).catch(() => { })
    cvDocumentApi.getMyCvs().then(setCvDocs).catch(() => { })
  }, [user])

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  const handleDelete = async (id: number) => {
    if (!confirm(t('dash.confirmDelete'))) return
    setDeleting(id)
    try {
      await cvDocumentApi.deleteCv(id)
      setCvDocs(prev => prev ? {
        ...prev,
        content: prev.content.filter(c => c.id !== id),
        totalElements: prev.totalElements - 1,
      } : prev)
    } catch { }
    setDeleting(null)
  }

  const handleSetPrimary = async (id: number) => {
    try {
      const updated = await cvDocumentApi.setPrimary(id)
      setCvDocs(prev => prev ? {
        ...prev,
        content: prev.content.map(c => ({ ...c, isPrimary: c.id === updated.id }))
      } : prev)
    } catch { }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dash.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('dash.welcome', { name: user.fullName.split(' ')[0] })}</p>
        </div>
        <Link href="/cv/generate" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
          <span>✨</span> {t('dash.buildNewCv')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('dash.savedCvs'), value: cvDocs?.totalElements ?? 0, icon: '📄' },
          { label: t('dash.bestAtsScore'), value: cvDocs?.content.reduce((max, c) => Math.max(max, c.atsScore ?? 0), 0) ?? 0, icon: '🎯' },
          { label: t('dash.skillsListed'), value: profile?.skills?.length ?? 0, icon: '🛠' },
          { label: t('dash.profileComplete'), value: profile ? `${calcCompletion(profile)}%` : '0%', icon: '✅' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['cvs', 'profile'] as const).map(tName => (
          <button key={tName} onClick={() => setTab(tName)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === tName ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}>
            {tName === 'cvs' ? t('dash.myCvs') : t('dash.profile')}
          </button>
        ))}
      </div>

      {tab === 'cvs' && (
        <div>
          {!cvDocs || cvDocs.content.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dash.noCvsYet')}</h3>
              <p className="text-gray-500 text-sm mb-6">{t('dash.noCvsDesc')}</p>
              <Link href="/cv/generate" className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-block">
                {t('dash.buildFirstCv')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cvDocs.content.map(cv => (
                <CvCard key={cv.id} cv={cv} onDelete={handleDelete} onSetPrimary={handleSetPrimary} deleting={deleting === cv.id} />
              ))}
              {/* Add new card */}
              <Link href="/cv/generate"
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:bg-blue-50/50 transition-all group min-h-50">
                <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                  <span className="text-2xl">+</span>
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">{t('dash.createNewCv')}</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">{t('dash.cvProfile')}</h3>
            <span className="text-sm text-gray-500">{t('dash.prefillHint')}</span>
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
            <p className="text-gray-500 text-sm">Loading profile...</p>
          )}
          <Link href="/profile" className="mt-6 inline-block bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
            {t('dash.editFullProfile')}
          </Link>
        </div>
      )}
    </div>
  )
}

function CvCard({ cv, onDelete, onSetPrimary, deleting }: {
  cv: CvDocument
  onDelete: (id: number) => void
  onSetPrimary: (id: number) => void
  deleting: boolean
}) {
  const { t } = useI18n()
  const scoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-500'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{cv.title}</h3>
            {cv.isPrimary && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium shrink-0">{t('dash.primary')}</span>
            )}
          </div>
          {cv.jdTitle && <p className="text-xs text-gray-500 mt-0.5 truncate">For: {cv.jdTitle}</p>}
        </div>
        {cv.atsScore != null && (
          <div className={`text-right shrink-0 ${scoreColor(cv.atsScore)}`}>
            <div className="text-lg font-bold">{cv.atsScore}</div>
            <div className="text-xs">ATS</div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400">
        {cv.templateId && <span className="mr-3">{t('dash.template', { id: cv.templateId })}</span>}
        <span>{new Date(cv.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        {cv.downloadUrl && (
          <a href={cv.downloadUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium text-blue-600 border border-blue-200 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            {t('dash.download')}
          </a>
        )}
        {!cv.isPrimary && (
          <button onClick={() => onSetPrimary(cv.id)}
            className="flex-1 text-center text-xs font-medium text-gray-600 border border-gray-200 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            {t('dash.setPrimary')}
          </button>
        )}
        <button onClick={() => onDelete(cv.id)} disabled={deleting}
          className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
          {deleting ? t('dash.deleting') : t('dash.delete')}
        </button>
      </div>
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
