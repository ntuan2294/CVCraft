import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/authContext'
import { LanguageProvider } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'CVCraft — AI-Powered CV Builder',
  description: 'Create professional, ATS-optimized CVs in minutes with multi-agent AI. Tailored to any job description.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="font-sans" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
