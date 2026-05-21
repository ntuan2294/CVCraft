'use client'

import { useState } from 'react'
import type { JDCardResult, JDFormattedDetail } from '@/lib/types'
import { api } from '@/lib/api'

const INDUSTRY_VI: Record<string, string> = {
  tech: 'Công nghệ', marketing: 'Marketing', finance: 'Tài chính',
  design: 'Thiết kế', product: 'Sản phẩm', sales: 'Kinh doanh',
  hr: 'Nhân sự', engineering: 'Kỹ thuật', education: 'Giáo dục', healthcare: 'Y tế',
}

const SENIORITY_VI: Record<string, string> = {
  junior: 'Junior', mid: 'Mid-level', senior: 'Senior',
}

const QUICK_INFO_LABELS: Record<string, string> = {
  salary: 'Lương', location: 'Địa điểm',
  experience_level: 'Kinh nghiệm', job_position: 'Vị trí',
}

interface Props {
  card: JDCardResult
  prefetched?: JDFormattedDetail
  onGenerate: (detail: JDFormattedDetail, card: JDCardResult) => void
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <section>
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      <ul className="mt-1.5 list-disc space-y-1 pl-5">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-6 text-gray-700">{item}</li>
        ))}
      </ul>
    </section>
  )
}

export default function JDResultCard({ card, prefetched, onGenerate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<JDFormattedDetail | null>(prefetched ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const industry = card.industry ? (INDUSTRY_VI[card.industry] ?? card.industry) : ''
  const seniority = card.seniority ? (SENIORITY_VI[card.seniority] ?? card.seniority) : ''
  const tags = [industry, seniority].filter(Boolean)

  async function handleClick() {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (detail) return
    setLoading(true)
    setError('')
    try {
      const data = await api.jd.format(card.id)
      setDetail(data)
    } catch {
      setError('Không thể tải chi tiết JD.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-xl border bg-white transition-all ${expanded ? 'border-indigo-400 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'}`}>
      <button
        type="button"
        onClick={handleClick}
        className="w-full cursor-pointer px-5 py-4 text-left"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-gray-950">{card.title}</h3>
            {card.company && (
              <p className="mt-0.5 text-sm font-medium text-gray-500">{card.company}</p>
            )}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs font-semibold text-gray-400">
              {Math.round(card.similarity_score * 100)}%
            </span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
              AI đang phân tích JD…
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {detail && (
            <>
              {Object.keys(detail.quick_info).length > 0 && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {Object.entries(detail.quick_info).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-500">{QUICK_INFO_LABELS[key] ?? key}</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <BulletSection title="Mô tả công việc" items={detail.description_bullets} />
                <BulletSection title="Yêu cầu công việc" items={detail.requirements_bullets} />
                <BulletSection title="Phúc lợi" items={detail.benefits_bullets} />
              </div>

              <button
                type="button"
                onClick={() => onGenerate(detail, card)}
                className="mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Tạo CV theo JD này
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
