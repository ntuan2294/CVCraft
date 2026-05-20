'use client'

import type { QualityScore } from '@/lib/types'

interface Props {
  score: QualityScore
  messages: string[]
  outputPath?: string
  onExportPdf?: () => void
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 10) * 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold">{value.toFixed(1)}/10</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function QualityScoreDisplay({ score, messages, outputPath, onExportPdf }: Props) {
  const overall = Math.round((score.overall_score / 10) * 100)
  const ringColor =
    overall >= 80 ? 'text-green-500' : overall >= 60 ? 'text-yellow-500' : 'text-red-500'
  const strokeColor =
    overall >= 80 ? 'stroke-green-500' : overall >= 60 ? 'stroke-yellow-500' : 'stroke-red-500'

  function handleDownload() {
    if (!outputPath) return
    const a = document.createElement('a')
    a.href = `/api/cv/download?path=${encodeURIComponent(outputPath)}`
    a.download = 'cv.docx'
    a.click()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                className={strokeColor}
                strokeDasharray={`${overall} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center font-bold text-xl ${ringColor}`}>
              {overall}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-900">Điểm chất lượng CV</p>
            <p className={`text-sm font-medium ${ringColor}`}>
              {overall >= 80 ? 'Xuất sắc' : overall >= 60 ? 'Tốt' : 'Cần cải thiện'}
            </p>
            {score.needs_revision && (
              <p className="text-xs text-amber-600 mt-1">⚠ Cần chỉnh sửa thêm</p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <ScoreBar label="Tương thích ATS" value={score.ats_score} />
          <ScoreBar label="Độ phù hợp JD" value={score.jd_match_score} />
          <ScoreBar label="Chất lượng ngôn ngữ" value={score.linguistic_score} />
        </div>

        {outputPath && (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              DOCX
            </button>
            <button
              onClick={onExportPdf}
              className="py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              PDF
            </button>
          </div>
        )}
      </div>

      {score.feedback.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-800 mb-2">Phản hồi từ AI</h3>
          <ul className="space-y-1">
            {score.feedback.map((f, i) => (
              <li key={i} className="text-sm text-amber-700 flex gap-2">
                <span className="shrink-0">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {messages.length > 0 && (
        <details className="rounded-xl border border-gray-200 bg-white">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
            Nhật ký xử lý ({messages.length} bước)
          </summary>
          <div className="px-4 pb-4 space-y-1">
            {messages.map((m, i) => (
              <p key={i} className="text-xs text-gray-500 font-mono">{m}</p>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
