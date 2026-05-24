'use client'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function LandingPage() {
  const { t } = useI18n()

  const features = [
    { icon: '🤖', titleKey: 'home.feat1Title', descKey: 'home.feat1Desc' },
    { icon: '🎯', titleKey: 'home.feat2Title', descKey: 'home.feat2Desc' },
    { icon: '📊', titleKey: 'home.feat3Title', descKey: 'home.feat3Desc' },
    { icon: '📝', titleKey: 'home.feat4Title', descKey: 'home.feat4Desc' },
    { icon: '⚡', titleKey: 'home.feat5Title', descKey: 'home.feat5Desc' },
    { icon: '💾', titleKey: 'home.feat6Title', descKey: 'home.feat6Desc' },
  ] as const


  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-linear-to-br from-blue-950 via-blue-900 to-violet-900 text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-700/50 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {t('home.heroBadge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t('home.heroTitle1')}<br />
              <span className="bg-linear-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
                {t('home.heroTitle2')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
              {t('home.heroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-3xl mx-auto">
              <Link
                href="/cv/generate"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-blue-700 shadow-2xl transition-colors hover:bg-blue-50"
              >
                {t('home.ctaBuildCv')}
              </Link>
              <Link
                href="/jd/search"
                className="inline-flex items-center justify-center rounded-2xl border border-blue-400/60 px-8 py-4 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-800/40"
              >
                {t('home.ctaJdSearch')}
              </Link>
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
            { label: t('home.stat1Label'), value: '5+', icon: '📄' },
            { label: t('home.stat3Label'), value: '< 2 min', icon: '⚡' },
            { label: t('home.stat5Label'), value: 'DOCX/PDF', icon: '💾' },
            { label: t('home.stat6Label'), value: 'Free', icon: '🎁' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.featuresTitle')}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{t('home.featuresDesc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.titleKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-blue-100 transition-all">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t(f.titleKey)}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>



      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-linear-to-br from-blue-600 to-violet-700 rounded-3xl p-12 text-center text-white">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-3xl font-bold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8 text-lg">{t('home.ctaDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cv/generate" className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              {t('home.ctaBuildCv')}
            </Link>
            <Link href="/jd/search" className="border border-blue-400 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors">
              {t('home.ctaJdSearch')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
