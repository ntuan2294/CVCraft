'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cvDocumentApi } from '@/lib/backendApi'
import type { CvDocument, GenerateCVResponse } from '@/lib/types'
import { GenerateCvResult } from '@/features/generate-cv/components/GenerateCvResult'
import { downloadCvEditorAsImage, downloadCvEditorAsPdf } from '@/features/generate-cv/utils/export'
import { useI18n } from '@/lib/i18n'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function EditCvPage() {
  const params = useParams()
  const router = useRouter()
  const { t, locale } = useI18n()
  const { user, loading: authLoading } = useRequireAuth()
  const id = Number(params.id)

  const [cv, setCv] = useState<CvDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !user) return
    if (isNaN(id)) {
      setError(locale === 'vi' ? 'ID không hợp lệ' : 'Invalid ID')
      setLoading(false)
      return
    }
    cvDocumentApi.getCv(id)
      .then(setCv)
      .catch((err) => {
        console.error(err)
        setError(err instanceof Error ? err.message : (locale === 'vi' ? 'Không tải được CV' : 'Failed to load CV'))
      })
      .finally(() => setLoading(false))
  }, [id, locale, authLoading, user])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
      </div>
    )
  }
  if (!user) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !cv) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-600 font-semibold mb-6 text-lg">{error || (locale === 'vi' ? 'Không tìm thấy CV' : 'CV not found')}</p>
        <button
          onClick={() => router.push('/dashboard/candidate')}
          className="rounded-2xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          {locale === 'vi' ? 'Quay lại Bảng điều khiển' : 'Back to Dashboard'}
        </button>
      </div>
    )
  }

  // Parse output_path from downloadUrl
  let outputPath = ''
  if (cv.downloadUrl) {
    try {
      const url = new URL(cv.downloadUrl, window.location.origin)
      outputPath = url.searchParams.get('path') || ''
    } catch {
      // fallback if it's a relative path starting with /api
      const match = cv.downloadUrl.match(/[?&]path=([^&]+)/)
      if (match) {
        outputPath = decodeURIComponent(match[1])
      }
    }
  }

  const mockResult: GenerateCVResponse = {
    status: 'done',
    output_path: outputPath,
    messages: []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4">
        <div>
          <Link
            href="/dashboard/candidate"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← {locale === 'vi' ? 'Quay lại Bảng điều khiển' : 'Back to Dashboard'}
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{cv.title}</h1>
            {cv.isPrimary && (
              <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                {locale === 'vi' ? 'Mặc định' : 'Primary'}
              </span>
            )}
          </div>
          {cv.jdTitle && (
            <p className="text-xs text-gray-500 mt-1">
              For: <span className="font-semibold text-gray-700">{cv.jdTitle}</span>
            </p>
          )}
        </div>
      </div>

      <GenerateCvResult
        result={mockResult}
        onDownload={async (format) => {
          if (format === 'pdf') await downloadCvEditorAsPdf()
          else await downloadCvEditorAsImage(format)
        }}
        jobTitle={cv.jdTitle}
        templateId={cv.templateId}
        initialSaved={true}
      />
    </div>
  )
}
