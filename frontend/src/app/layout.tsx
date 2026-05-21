import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/authContext'
import { LanguageProvider } from '@/lib/i18n'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVCraft — AI-Powered CV Builder',
  description: 'Create professional, ATS-optimized CVs in minutes with multi-agent AI. Tailored to any job description.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={geist.className}>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px-280px)]">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
