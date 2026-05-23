'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/backendApi'
import { useI18n } from '@/lib/i18n'

function ResetPasswordForm() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError(t('auth.resetTokenMissing'))
      return
    }
    if (newPassword.length < 8) {
      setError(t('auth.passwordMin'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.resetPasswordError'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">{t('auth.resetTokenMissing')}</p>
        <Link href="/auth/forgot-password" className="block text-blue-600 hover:text-blue-700 font-medium text-sm">
          {t('auth.requestNewResetLink')}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      {success ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{t('auth.passwordResetSuccess')}</h2>
          <p className="text-sm text-gray-500">{t('auth.redirectingToLogin')}</p>
          <Link href="/auth/login" className="block text-blue-600 hover:text-blue-700 font-medium text-sm">
            {t('auth.signIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.confirmNewPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 text-sm">
            {loading ? t('auth.resettingPassword') : t('auth.resetPasswordBtn')}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.resetPasswordTitle')}</h1>
          <p className="text-gray-500 mt-2">{t('auth.resetPasswordSubtitle')}</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 h-64 animate-pulse" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
