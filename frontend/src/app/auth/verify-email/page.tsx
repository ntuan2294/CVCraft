'use client'
import { Suspense, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'

function VerifyEmailForm() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const { setAuthFromResponse } = useAuth()

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) submitOtp(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setDigits(next)
      inputRefs.current[5]?.focus()
      submitOtp(pasted)
    }
  }

  const submitOtp = async (code: string) => {
    if (!email) { setError(t('verify.noEmail')); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.verifyEmail(email, code)
      setAuthFromResponse(res)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('verify.invalidOtp'))
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return
    setResending(true)
    setError('')
    try {
      await authApi.resendVerification(email)
      setResendCooldown(60)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('verify.resendFailed'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        {email && (
          <p className="text-sm text-gray-500">
            {t('verify.sentTo')} <span className="font-semibold text-gray-700">{email}</span>
          </p>
        )}
      </div>

      {/* OTP input boxes */}
      <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleDigitChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={loading}
            className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            style={{ borderColor: digit ? '#2563eb' : '#e5e7eb' }}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center mb-4">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 text-center">
          {error}
        </div>
      )}

      <p className="text-center text-sm text-gray-500">{t('verify.expiry')}</p>

      <div className="mt-6 text-center">
        <span className="text-sm text-gray-500">{t('verify.didntReceive')} </span>
        <button
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0
            ? t('verify.resendIn').replace('{s}', String(resendCooldown))
            : resending ? t('verify.resending') : t('verify.resend')}
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600">
          {t('auth.backToSignIn')}
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">{t('verify.title')}</h1>
          <p className="text-gray-500 mt-2">{t('verify.subtitle')}</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 h-64 animate-pulse" />}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  )
}
