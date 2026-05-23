'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'

function LoginForm() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push(redirect)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('email not verified')) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
        return
      }
      setError(msg || t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.emailAddress')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('auth.emailPlaceholder')} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
            <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('auth.passwordPlaceholder')} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 text-sm">
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {t('auth.noAccount')}{' '}
        <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
          {t('auth.createOneFree')}
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { t } = useI18n()
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">CV</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">CVCraft</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
          <p className="text-gray-500 mt-2">{t('auth.signInToAccount')}</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
