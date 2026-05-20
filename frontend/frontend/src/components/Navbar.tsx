'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, logout, isRecruiter } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CVCraft</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/jobs">Find Jobs</NavLink>
            <NavLink href="/candidates">Browse Talent</NavLink>
            <NavLink href="/companies">Companies</NavLink>
            <NavLink href="/cv/generate">AI CV Builder</NavLink>
            <NavLink href="/jd/search">JD Search</NavLink>
          </div>

          {/* Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-medium">
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
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {user.role}
                      </span>
                    </div>
                    <Link href={isRecruiter ? '/dashboard/recruiter' : '/dashboard/candidate'}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropOpen(false)}>
                      Dashboard
                    </Link>
                    {!isRecruiter && (
                      <Link href="/applications" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                        My Applications
                      </Link>
                    )}
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropOpen(false)}>
                      Profile Settings
                    </Link>
                    <div className="border-t border-gray-100 mt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link href="/auth/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Get Started
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
          {[
            ['Find Jobs', '/jobs'],
            ['Browse Talent', '/candidates'],
            ['Companies', '/companies'],
            ['AI CV Builder', '/cv/generate'],
            ['JD Search', '/jd/search'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            {user ? (
              <button onClick={handleLogout} className="w-full text-sm text-red-600 py-2 rounded-lg border border-red-200">Sign Out</button>
            ) : (
              <>
                <Link href="/auth/login" className="flex-1 text-center text-sm border border-gray-200 py-2 rounded-lg text-gray-700">Sign In</Link>
                <Link href="/auth/register" className="flex-1 text-center text-sm bg-blue-600 text-white py-2 rounded-lg">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
