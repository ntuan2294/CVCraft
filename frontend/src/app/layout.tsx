import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVCraft — Tạo CV bằng AI',
  description: 'Tìm kiếm JD và tạo CV tự động bằng AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.className} bg-white`}>
      <body className="min-h-screen bg-white text-gray-950">
        <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="group flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-sm font-black text-white shadow-sm shadow-indigo-200 transition-colors group-hover:bg-indigo-700">
                  CV
                </span>
                <span className="text-2xl font-black tracking-tight">
                  <span className="text-gray-950">CV</span>
                  <span className="text-indigo-600">Craft</span>
                </span>
              </Link>
              <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
                <Link href="/" className="transition-colors hover:text-indigo-600">Find Jobs</Link>
                <Link href="#" className="transition-colors hover:text-indigo-600">Browse Talent</Link>
                <Link href="#" className="transition-colors hover:text-indigo-600">Companies</Link>
                <Link href="/generate" className="transition-colors hover:text-indigo-600">AI CV Builder</Link>
                <Link href="/" className="transition-colors hover:text-indigo-600">JD Search</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600">
                Sign In
              </button>
              <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                Get Started
              </button>
            </div>
          </div>
        </nav>

        <main className="min-h-[calc(100vh-4rem)] bg-white">
          {children}
        </main>

        <footer className="bg-gray-900 text-gray-400">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-black text-white">CV</span>
                  <span className="text-lg font-black text-white">CVCraft</span>
                </div>
                <p className="text-sm leading-relaxed">
                  The smarter way to hire and get hired. AI-powered CV builder, job search, and talent discovery.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">For Job Seekers</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/" className="transition-colors hover:text-white">Browse Jobs</Link></li>
                  <li><Link href="/generate" className="transition-colors hover:text-white">AI CV Builder</Link></li>
                  <li><Link href="/" className="transition-colors hover:text-white">JD Search</Link></li>
                  <li><Link href="#" className="transition-colors hover:text-white">Create Account</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">For Recruiters</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="#" className="transition-colors hover:text-white">Browse Candidates</Link></li>
                  <li><Link href="#" className="transition-colors hover:text-white">Find a Job</Link></li>
                  <li><Link href="#" className="transition-colors hover:text-white">Company Profiles</Link></li>
                  <li><Link href="#" className="transition-colors hover:text-white">Recruiter Sign Up</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="#" className="transition-colors hover:text-white">About Us</Link></li>
                  <li><Link href="#" className="transition-colors hover:text-white">Career Blog</Link></li>
                  <li><Link href="#" className="transition-colors hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="#" className="transition-colors hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
