import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/authContext'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVCraft — Professional Recruitment Platform',
  description: 'Find your dream job or top talent. AI-powered CV builder, job search, and candidate matching.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px-280px)]">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
