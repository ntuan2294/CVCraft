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
              <div className="flex gap-6 text-sm font-semibold text-gray-600">
                <Link href="/" className="transition-colors hover:text-indigo-600">
                  Tìm JD
                </Link>
                <Link href="/generate" className="transition-colors hover:text-indigo-600">
                  Tạo CV
                </Link>
              </div>
            </div>
            <button
              type="button"
              aria-label="Tài khoản người dùng"
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              U
            </button>
          </div>
        </nav>
        <main className="min-h-[calc(100vh-4rem)] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
        </main>
      </body>
    </html>
  )
}
