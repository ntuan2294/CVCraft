import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/authContext'
import { LanguageProvider } from '@/lib/i18n'
import './globals.css'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
})

export const metadata: Metadata = {
  title: 'CVCraft — AI-Powered CV Builder',
  description: 'Create professional, ATS-optimized CVs in minutes with multi-agent AI. Tailored to any job description.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} font-sans`} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900" suppressHydrationWarning>
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
