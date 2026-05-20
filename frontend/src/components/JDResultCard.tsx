'use client'

import type { JDDocument } from '@/lib/types'
import { getJDSectionItems, pickJDDetail } from '@/lib/jd'

const INDUSTRY_VI: Record<string, string> = {
  tech: 'Công nghệ', marketing: 'Marketing', finance: 'Tài chính',
  design: 'Thiết kế', product: 'Sản phẩm', sales: 'Kinh doanh',
  hr: 'Nhân sự', engineering: 'Kỹ thuật', education: 'Giáo dục', healthcare: 'Y tế',
}

const SENIORITY_VI: Record<string, string> = {
  junior: 'Junior', mid: 'Mid-level', senior: 'Senior',
}

interface Props {
  jd: JDDocument
  selected: boolean
  onSelect: () => void
  onGenerate: () => void
}

function BulletSection({ title, items, fallback }: { title: string; items?: string[]; fallback?: string }) {
  const hasItems = items && items.length > 0
  if (!hasItems && !fallback?.trim()) return null

  return (
    <section>
      <h4 className="text-base font-semibold text-gray-950">{title}</h4>
      {hasItems ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-6 text-gray-700">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{fallback}</p>
      )}
    </section>
  )
}

export default function JDResultCard({ jd, selected, onSelect, onGenerate }: Props) {
  const company = pickJDDetail(jd, 'company_name', jd.company ?? '')
  const title = pickJDDetail(jd, 'job_title', jd.title)
  const industry = pickJDDetail(jd, 'job_industry', jd.industry ? INDUSTRY_VI[jd.industry] ?? jd.industry : '')
  const position = pickJDDetail(jd, 'job_position')
  const experience = pickJDDetail(jd, 'experience_level')
  const salary = pickJDDetail(jd, 'salary')
  const location = pickJDDetail(jd, 'location')
  const seniority = jd.seniority ? SENIORITY_VI[jd.seniority] ?? jd.seniority : ''
  const description = pickJDDetail(jd, 'job_description', jd.description)
  const requirements = pickJDDetail(jd, 'requirements')
  const benefits = pickJDDetail(jd, 'benefits')
  const descriptionItems = getJDSectionItems(jd, 'job_description')
  const requirementItems = getJDSectionItems(jd, 'requirements')
  const benefitItems = getJDSectionItems(jd, 'benefits')
  const quickInfo = [
    { label: 'Lương', value: salary },
    { label: 'Địa điểm', value: location },
    { label: 'Ngành nghề', value: industry },
    { label: 'Vị trí', value: position || seniority },
    { label: 'Kinh nghiệm', value: experience },
  ].filter((item) => item.value)

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border bg-white transition-all ${
        selected
          ? 'border-emerald-600 shadow-sm'
          : 'border-gray-200 hover:border-emerald-400 hover:shadow-sm'
      }`}
    >
      <div className="border-b border-gray-100 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold leading-7 text-gray-950">{title}</h3>
            {company && <p className="mt-1 text-sm font-medium uppercase text-gray-600">{company}</p>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onGenerate()
            }}
            className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Tạo CV theo JD
          </button>
        </div>

        {quickInfo.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {quickInfo.map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5 p-5">
        <BulletSection title="Mô tả công việc" items={descriptionItems} fallback={description} />
        <BulletSection title="Yêu cầu công việc" items={requirementItems} fallback={requirements} />
        <BulletSection title="Phúc lợi" items={benefitItems} fallback={benefits} />
      </div>
    </div>
  )
}
