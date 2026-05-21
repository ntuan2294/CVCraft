import { useState } from 'react'
import DocxOutputEditor from '@/components/DocxOutputEditor'
import type { GenerateCVResponse } from '@/lib/types'
import { cvDocumentApi } from '@/lib/backendApi'

export function GenerateCvResult({
  result,
  onDownloadDocx,
  onExportPdf,
  jobTitle,
  jdText,
  templateId,
}: {
  result: GenerateCVResponse | null
  onDownloadDocx: () => void
  onExportPdf: () => void
  jobTitle?: string
  jdText?: string
  templateId?: string
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

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
    <div className={result ? 'space-y-4' : 'self-start space-y-4 xl:sticky xl:top-20'}>
      {!result ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-gray-400">
          <p className="mb-3 text-4xl">📄</p>
          <p className="font-medium">Kết quả sẽ hiển thị ở đây</p>
          <p className="mt-1 text-sm">Điền thông tin và nhấn Tạo CV</p>
        </div>
      ) : (
        <section className="space-y-3 rounded-2xl border border-gray-200 bg-slate-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">CV editor</h2>
              <p className="text-xs text-gray-500">Chỉnh trực tiếp trên CV đã được sinh.</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={onDownloadDocx}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                disabled={!result.output_path}
              >
                Tải DOCX
              </button>
              <button
                type="button"
                onClick={onExportPdf}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
              >
                Xuất PDF
              </button>
              {/* Save to library button */}
              {saved ? (
                <span className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 flex items-center gap-1">
                  ✓ Đã lưu
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                >
                  {saving ? 'Đang lưu...' : '💾 Lưu vào thư viện'}
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

          <DocxOutputEditor outputPath={result.output_path} />
        </section>
      )}
    </div>
  )
}
