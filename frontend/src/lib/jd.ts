import type { JDDocument } from './types'

export function pickJDDetail(jd: JDDocument, key: string, fallback = '') {
  return jd.details?.[key]?.trim() || fallback
}

export function getJDSectionItems(
  jd: JDDocument,
  section: 'job_description' | 'requirements' | 'benefits',
) {
  const rewritten = jd.rewritten_sections?.[section] ?? []
  if (rewritten.length > 0) return rewritten

  if (section === 'job_description') return jd.description_bullets ?? []
  if (section === 'requirements') return jd.requirements_bullets ?? []
  return jd.benefits_bullets ?? []
}

function sectionToText(title: string, items: string[], fallback: string) {
  const content = items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : fallback.trim()
  return content ? `${title}\n${content}` : ''
}

export function buildJDText(jd: JDDocument) {
  const title = pickJDDetail(jd, 'job_title', jd.title)
  const company = pickJDDetail(jd, 'company_name', jd.company ?? '')
  const header = [title, company].filter(Boolean).join(' - ')

  const sections = [
    sectionToText(
      'Mô tả công việc',
      getJDSectionItems(jd, 'job_description'),
      pickJDDetail(jd, 'job_description', jd.description),
    ),
    sectionToText(
      'Yêu cầu công việc',
      getJDSectionItems(jd, 'requirements'),
      pickJDDetail(jd, 'requirements'),
    ),
    sectionToText(
      'Phúc lợi',
      getJDSectionItems(jd, 'benefits'),
      pickJDDetail(jd, 'benefits'),
    ),
  ].filter(Boolean)

  return [header, ...sections].filter(Boolean).join('\n\n')
}
