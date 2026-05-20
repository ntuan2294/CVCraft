'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'

export default function RegisterPage() {
  const { t } = useI18n()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', role: 'CANDIDATE' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialRole = searchParams.get('role') ?? 'CANDIDATE'
  useState(() => { setForm(f => ({ ...f, role: initialRole })) })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError(t('auth.passwordMin')); return }
    setLoading(true)
    try {
      await register(form)
      router.push(form.role === 'RECRUITER' ? '/dashboard/recruiter' : '/dashboard/candidate')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.createAccount')}</h1>
          <p className="text-gray-500 mt-2">{t('auth.joinProfessionals')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Role Selector */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">{t('auth.iAmA')}</p>
            <div className="grid grid-cols-2 gap-3">
              {(['CANDIDATE', 'RECRUITER'] as const).map(r => (
                <button key={r} type="button" onClick={() => update('role', r)}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.role === r
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r === 'CANDIDATE' ? `👤 ${t('auth.candidate')}` : `🏢 ${t('auth.recruiter')}`}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.fullName')}</label>
              <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)} required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.emailAddress')}</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.phone')}</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+84 912 345 678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 text-sm">
              {loading ? t('auth.registering') : t('auth.register')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('auth.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
