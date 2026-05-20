'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { jobApi } from '@/lib/backendApi'
import { useI18n } from '@/lib/i18n'
import type { JobPost } from '@/lib/types'

export default function LandingPage() {
  const { t, locale } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [featuredJobs, setFeaturedJobs] = useState<JobPost[]>([])
  const [stats, setStats] = useState({ openJobs: 0, totalCandidates: 0, totalRecruiters: 0 })
  const router = useRouter()

  useEffect(() => {
    jobApi.getFeatured(6).then(setFeaturedJobs).catch(() => {})
    jobApi.getStats().then(setStats).catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('keyword', searchQuery)
    if (location) params.set('location', location)
    router.push(`/jobs?${params}`)
  }

  const popularTerms = t('home.popularTerms').split(',')

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-violet-900 text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-700/50 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {stats.openJobs > 0
                ? t('home.openPositions', { n: stats.openJobs.toLocaleString() })
                : t('home.newJobsDaily')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t('home.heroTitle1')}<br />
              <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
                {t('home.heroTitle2')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
              {t('home.heroDesc')}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-2 px-3">
                <SearchIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full text-gray-900 placeholder-gray-400 text-sm focus:outline-none py-2"
                />
              </div>
              <div className="flex items-center gap-2 px-3 sm:border-l border-gray-200">
                <LocationIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder={t('home.locationPlaceholder')}
                  className="w-full text-gray-900 placeholder-gray-400 text-sm focus:outline-none py-2"
                />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap text-sm">
                {t('home.searchJobs')}
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-blue-300">
              <span>{t('home.popular')}</span>
              {popularTerms.map(term => (
                <button key={term} onClick={() => router.push(`/jobs?keyword=${encodeURIComponent(term)}`)}
                  className="hover:text-white underline-offset-2 hover:underline transition-colors">{term}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 -mt-2">
          {[
            { label: t('home.openJobs'), value: stats.openJobs > 0 ? `${stats.openJobs.toLocaleString()}+` : '10,000+', icon: '💼' },
            { label: t('home.activeCandidates'), value: stats.totalCandidates > 0 ? `${stats.totalCandidates.toLocaleString()}+` : '50,000+', icon: '👤' },
            { label: t('home.companiesHiring'), value: stats.totalRecruiters > 0 ? `${stats.totalRecruiters.toLocaleString()}+` : '2,000+', icon: '🏢' },
            { label: t('home.cvsGenerated'), value: '25,000+', icon: '📄' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('home.featuredJobs')}</h2>
            <p className="text-gray-500 mt-1">{t('home.hotOpportunities')}</p>
          </div>
          <Link href="/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            {t('home.viewAllJobs')}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredJobs.length > 0 ? featuredJobs.map(job => (
            <FeaturedJobCard key={job.id} job={job} />
          )) : Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.howItWorks')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('home.getHiredFaster')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', titleKey: 'home.step1Title', descKey: 'home.step1Desc', icon: '🔍' },
              { step: '02', titleKey: 'home.step2Title', descKey: 'home.step2Desc', icon: '✨' },
              { step: '03', titleKey: 'home.step3Title', descKey: 'home.step3Desc', icon: '🚀' },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                  {t('home.step')} {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t(item.titleKey as Parameters<typeof t>[0])}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t(item.descKey as Parameters<typeof t>[0])}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-3xl p-12 text-center text-white">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-3xl font-bold mb-4">{t('home.aiBannerTitle')}</h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8 text-lg">{t('home.aiBannerDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cv/generate" className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              {t('home.buildCvFree')}
            </Link>
            <Link href="/jd/search" className="border border-blue-400 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors">
              {t('home.searchJobDescriptions')}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA for Recruiters */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="text-5xl mb-6">🎯</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.hiringTitle')}</h2>
              <p className="text-gray-500 mb-6 text-lg leading-relaxed">{t('home.hiringDesc')}</p>
              <ul className="space-y-3 mb-8">
                {(['home.feature1', 'home.feature2', 'home.feature3', 'home.feature4'] as const).map(key => (
                  <li key={key} className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    {t(key)}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Link href="/candidates" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm">
                  {t('home.browseCandidates')}
                </Link>
                <Link href="/auth/register?role=RECRUITER" className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                  {t('home.postJob')}
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              {[
                { labelKey: 'home.timeToHire', valKey: 'home.timeToHireVal', color: 'from-blue-500 to-blue-600' },
                { labelKey: 'home.qualityCandidates', valKey: 'home.qualityCandidatesVal', color: 'from-violet-500 to-violet-600' },
                { labelKey: 'home.atsOptimized', valKey: null, color: 'from-green-500 to-green-600' },
                { labelKey: 'home.satisfactionRate', valKey: null, color: 'from-orange-500 to-orange-600' },
              ].map(m => (
                <div key={m.labelKey} className={`bg-gradient-to-br ${m.color} rounded-2xl p-6 text-white`}>
                  <div className="text-2xl font-bold mb-1">
                    {m.valKey ? t(m.valKey as Parameters<typeof t>[0]) : (m.labelKey === 'home.atsOptimized' ? '100%' : '98%')}
                  </div>
                  <div className="text-sm opacity-80">{t(m.labelKey as Parameters<typeof t>[0])}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeaturedJobCard({ job }: { job: JobPost }) {
  const { t, locale } = useI18n()
  const salaryText = job.isSalaryVisible && job.salaryMin
    ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${((job.salaryMax ?? job.salaryMin * 1.5) / 1000).toFixed(0)}k`
    : null

  return (
    <Link href={`/jobs/${job.id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-6 group block">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg font-bold text-blue-600 shrink-0">
          {job.company.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{job.title}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            {job.company.name}
            {job.company.isVerified && <span className="text-blue-500" title="Verified">✓</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge>{job.location}</Badge>
        <Badge>{job.workMode.replace('_', ' ')}</Badge>
        <Badge>{job.jobType.replace('_', ' ')}</Badge>
      </div>
      {salaryText && <div className="text-sm font-semibold text-green-600 mb-3">{salaryText}</div>}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{t('card.applicants', { n: job.applicationCount })}</span>
        <span>{timeAgo(job.createdAt, t, locale)}</span>
      </div>
    </Link>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{children}</span>
}

function timeAgo(dateStr: string, t: (key: Parameters<ReturnType<typeof useI18n>['t']>[0], vars?: Record<string, string | number>) => string, _locale: string) {
  const ms = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) return t('card.today')
  if (days === 1) return t('card.dayAgo')
  if (days < 7) return t('card.daysAgo', { n: days })
  if (days < 30) return t('card.weeksAgo', { n: Math.floor(days / 7) })
  return t('card.monthsAgo', { n: Math.floor(days / 30) })
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
}

function LocationIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
}
