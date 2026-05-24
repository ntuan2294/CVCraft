'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { buildJDText } from '@/lib/jd'
import JdUploadButton from '@/components/JdUploadButton'
import { useI18n } from '@/lib/i18n'
import { useRequireAuth } from '@/hooks/useRequireAuth'

interface AnalysisResult {
  evaluation: string
  suggestions: string[]
  score: number
}

function ScoreRing({ score, scoreLabel, excellent, good, average, needsWork }: {
  score: number
  scoreLabel: string
  excellent: string
  good: string
  average: string
  needsWork: string
}) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? excellent : score >= 60 ? good : score >= 40 ? average : needsWork
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="56" y="62" textAnchor="middle" fontSize="24" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{scoreLabel}</p>
        <p className="text-base font-bold" style={{ color }}>{label}</p>
      </div>
    </div>
  )
}

function EditCvContent() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useRequireAuth()
  const [jdText, setJdText] = useState('')
  const cvInputRef = useRef<HTMLInputElement>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('edit_cv_jd')
    if (!stored) return
    sessionStorage.removeItem('edit_cv_jd')
    try {
      const parsedJd = buildJDText(JSON.parse(stored))
      queueMicrotask(() => setJdText(parsedJd))
    } catch {}
  }, [])

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (cvInputRef.current) cvInputRef.current.value = ''
    if (!file) return
    setCvFile(file)
    setAnalysisResult(null)
    setAnalyzeError('')
  }

  const handleAnalyze = async () => {
    if (!cvFile) { setAnalyzeError(t('editcv.errorNoFile')); return }
    if (!jdText.trim()) { setAnalyzeError(t('editcv.errorNoJd')); return }

    setAnalyzing(true)
    setAnalyzeError('')
    setAnalysisResult(null)

    try {
      const form = new FormData()
      form.append('cv_file', cvFile)
      form.append('jd_text', jdText)
      const res = await fetch('/api/edit-cv/analyze', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? t('editcv.errorFailed'))
      setAnalysisResult(data as AnalysisResult)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : t('editcv.errorFailed'))
    } finally {
      setAnalyzing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
      </div>
    )
  }
  if (!user) return null

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {!analysisResult && (
          <>
            <header className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{t('editcv.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('editcv.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">{t('editcv.jdSection')}</h2>
                  <JdUploadButton onExtracted={setJdText} />
                </div>
                <textarea
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  rows={9}
                  placeholder={t('editcv.jdPlaceholder')}
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">{t('editcv.cvSection')}</h2>
                <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-5 py-8 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-9 w-9 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                  </svg>
                  {cvFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-indigo-600">{cvFile.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{t('editcv.changeFile')}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">{t('editcv.chooseFile')}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{t('editcv.fileFormats')}</p>
                    </div>
                  )}
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={handleCvFileChange}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing || !cvFile}
                  className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t('editcv.analyzing')}
                    </span>
                  ) : t('editcv.analyze')}
                </button>

                {analyzeError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {analyzeError}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {analysisResult && (
          <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex justify-center">
              <ScoreRing
                score={analysisResult.score}
                scoreLabel={t('editcv.scoreLabel')}
                excellent={t('editcv.scoreExcellent')}
                good={t('editcv.scoreGood')}
                average={t('editcv.scoreAverage')}
                needsWork={t('editcv.scoreNeedsWork')}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('editcv.reviewTitle')}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-700">
                {analysisResult.evaluation}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                {t('editcv.suggestionsTitle', { n: analysisResult.suggestions.length })}
              </h2>
              <ul className="mt-3 space-y-3">
                {analysisResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-3 text-sm leading-6 text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {index + 1}
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => { setAnalysisResult(null); setAnalyzeError('') }}
              className="mt-5 w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('editcv.analyzeAnother')}
            </button>
          </section>
        )}
      </div>
    </main>
  )
}

export default function EditCvPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
      </div>
    }>
      <EditCvContent />
    </Suspense>
  )
}
