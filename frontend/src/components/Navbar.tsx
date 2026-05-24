'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navLinks: [string, string][] = [
    [t('nav.aiCvBuilder'), '/cv/generate'],
    [t('nav.editCv'), '/edit-cv'],
    [t('nav.jdSearch'), '/jd/search'],
    [t('nav.myCvs'), user?.role === 'ADMIN' ? '/dashboard/candidate' : '/dashboard'],
    ...(user?.role === 'ADMIN' ? [[t('nav.adminPanel'), '/dashboard/admin'] as [string, string]] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CVCraft</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(([label, href]) => (
              <NavLink key={href} href={href}>{label}</NavLink>
            ))}
          </div>

          {/* Right side: Lang Toggle + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              title={locale === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
            >
              <span>{t('lang.toggle')}</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-medium">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropOpen(false)}
                    >
                      {t('nav.profileSettings')}
                    </Link>
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  {t('nav.signIn')}
                </Link>
                <Link href="/auth/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  {t('nav.getStarted')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="w-5 space-y-1">
              <span className={`block h-0.5 bg-gray-600 transition-transform ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-gray-600 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-gray-600 transition-transform ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(([label, href]) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            )
          })}
          <div className="pt-2 border-t border-gray-100 flex gap-2 items-center">
            <button
              onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600"
            >
              <span>{t('lang.toggle')}</span>
            </button>
            {user ? (
              <button onClick={handleLogout} className="flex-1 text-sm text-red-600 py-2 rounded-lg border border-red-200">
                {t('nav.signOut')}
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="flex-1 text-center text-sm border border-gray-200 py-2 rounded-lg text-gray-700">
                  {t('nav.signIn')}
                </Link>
                <Link href="/auth/register" className="flex-1 text-center text-sm bg-blue-600 text-white py-2 rounded-lg">
                  {t('nav.getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <Link href={href} className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'text-blue-600 bg-blue-50/80 font-semibold'
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
    }`}>
      {children}
    </Link>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  )
}
