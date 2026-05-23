import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { GenerateCVResponse } from '@/lib/types'
import { cvDocumentApi } from '@/lib/backendApi'
import { useI18n } from '@/lib/i18n'

const DocxOutputEditor = dynamic(() => import('@/components/DocxOutputEditor'), { ssr: false })
const HtmlOutputEditor = dynamic(() => import('@/components/HtmlOutputEditor'), { ssr: false })

export function GenerateCvResult({
  result,
  onDownload,
  jobTitle,
  jdText,
  templateId,
  initialSaved = false,
}: {
  result: GenerateCVResponse | null
  onDownload: (format: 'png' | 'jpg' | 'pdf') => void | Promise<void>
  jobTitle?: string
  jdText?: string
  templateId?: string
  initialSaved?: boolean
}) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(initialSaved)
  const [saveError, setSaveError] = useState('')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const isHtml = Boolean(result?.output_path?.toLowerCase().endsWith('.html'))

  const handleDownload = async (format: 'png' | 'jpg' | 'pdf') => {
    setDownloadOpen(false)
    await onDownload(format)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    setSaveError('')
    try {
      const atsScore = result.quality_score
        ? Math.round(result.quality_score.overall_score * 10)
        : undefined

      const fileName = result.output_path
        ? result.output_path.split(/[\\/]/).pop()
        : undefined

      const downloadUrl = result.output_path
        ? `/api/cv/download?path=${encodeURIComponent(result.output_path)}`
        : undefined

      await cvDocumentApi.saveCv({
        title: jobTitle ? `CV — ${jobTitle}` : 'My CV',
        templateId,
        fileName,
        downloadUrl,
        atsScore,
        jdTitle: jobTitle,
        jdText,
      })
      setSaved(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lưu thất bại'
      // 401 means not logged in
      setSaveError(msg.includes('401') || msg.toLowerCase().includes('unauthorized')
        ? 'Vui lòng đăng nhập để lưu CV'
        : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {result && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">{t('gen.cvEditor')}</h2>
              <p className="text-xs text-gray-500">{t('gen.cvEditorDesc')}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDownloadOpen((open) => !open)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                  disabled={!result.output_path}
                  aria-haspopup="menu"
                  aria-expanded={downloadOpen}
                >
                  {t('gen.download')}
                </button>
                {downloadOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu">
                    <button
                      type="button"
                      onClick={() => handleDownload('png')}
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      role="menuitem"
                    >
                      {t('gen.downloadPng')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('jpg')}
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      role="menuitem"
                    >
                      {t('gen.downloadJpg')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('pdf')}
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      role="menuitem"
                    >
                      {t('gen.downloadPdf')}
                    </button>
                  </div>
                )}
              </div>
              {/* Save to library button */}
              {saved ? (
                <span className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 flex items-center gap-1">
                  ✓ {t('gen.saved')}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                >
                  {saving ? t('gen.saving') : `💾 ${t('gen.saveLibrary')}`}
                </button>
              )}
            </div>
          </div>

          {saveError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center gap-2">
              <span>⚠</span>
              <span>{saveError}</span>
              {saveError.includes('đăng nhập') && (
                <a href="/auth/login" className="underline font-medium ml-1">Đăng nhập →</a>
              )}
            </div>
          )}

          {isHtml ? (
            <HtmlOutputEditor outputPath={result.output_path} />
          ) : (
            <DocxOutputEditor outputPath={result.output_path} />
          )}
        </section>
      )}
    </div>
  )
}
