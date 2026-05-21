'use client'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="text-lg font-bold text-white">CVCraft</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{t('footer.tagline')}</p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('footer.forUsers')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/cv/generate" className="hover:text-white transition-colors">{t('footer.aiCvBuilder')}</Link></li>
              <li><Link href="/jd/search" className="hover:text-white transition-colors">{t('footer.jdSearch')}</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">{t('footer.myCvLibrary')}</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">{t('footer.createAccount')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t('footer.resources')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">{t('footer.careerBlog')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">{t('footer.termsOfService')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{t('footer.copyright')}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{t('footer.poweredBy')}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full" />
            <span className="text-xs text-gray-500">Spring Boot + Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
