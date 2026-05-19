'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api'
import type { UserInput, WorkExperience, Education, Project, Certification, GenerateCVResponse, UploadedPhoto } from '@/lib/types'
import { buildJDText } from '@/lib/jd'
import TemplatePickerModal, { type CVTemplate } from '@/components/TemplatePickerModal'
import DocxOutputEditor from '@/components/DocxOutputEditor'

const EMPTY_EXP: WorkExperience = { company: '', position: '', start_date: '', end_date: '', description: '' }
const EMPTY_EDU: Education = { school: '', degree: '', major: '', start_date: '', end_date: '' }
const EMPTY_PROJ: Project = { name: '', description: '', link: '', start_date: '', end_date: '', tech_stack: [] }
const EMPTY_CERT: Certification = { name: '', issuer: '', date: '', link: '' }

const CV_TEMPLATES: CVTemplate[] = [
  {
    id: '1',
    name: 'Template 1',
    description: 'Có ảnh, dùng nhãn Profile cho phần tóm tắt',
    summaryLabel: 'Profile',
    supportsPhotoUpload: true,
    thumbnail: '/template-images/temp1.jpg',
    fields: ['photo', 'name', 'job_title', 'profile', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '2',
    name: 'Template 2',
    description: 'Có ảnh, dùng nhãn About me cho phần tóm tắt',
    summaryLabel: 'About me',
    supportsPhotoUpload: true,
    thumbnail: '/template-images/temp2.jpg',
    fields: ['photo', 'name', 'job_title', 'about_me', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '3',
    name: 'Template 3',
    description: 'Không ảnh, dùng nhãn Profile cho phần tóm tắt',
    summaryLabel: 'Profile',
    supportsPhotoUpload: false,
    thumbnail: '/template-images/temp3.jpg',
    fields: ['name', 'job_title', 'profile', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '4',
    name: 'Template 4',
    description: 'Mẫu có vùng ảnh trong file, dùng Personal summary',
    summaryLabel: 'Personal summary',
    supportsPhotoUpload: false,
    thumbnail: '/template-images/temp4.jpg',
    fields: ['photo', 'name', 'job_title', 'personal_summary', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
  {
    id: '5',
    name: 'Template 5',
    description: 'Không ảnh, dùng nhãn Summary gọn gàng',
    summaryLabel: 'Summary',
    supportsPhotoUpload: false,
    thumbnail: '/template-images/temp5.jpg',
    fields: ['name', 'job_title', 'summary', 'work_experience', 'education', 'contact', 'language', 'skills', 'reference'],
  },
]

const TEMPLATE_PATH_BY_ID: Record<string, string> = {
  '1': 'template cv/1.docx',
  '2': 'template cv/2.docx',
  '3': 'template cv/3.docx',
  '4': 'template cv/4.docx',
  '5': 'template cv/5.docx',
}

const SUMMARY_FIELD_BY_TEMPLATE: Record<string, 'profile' | 'about_me' | 'personal_summary' | 'summary'> = {
  '1': 'profile',
  '2': 'about_me',
  '3': 'profile',
  '4': 'personal_summary',
  '5': 'summary',
}


const SAMPLE_JD_TEXT = `Java Software Engineer
TechNova Solutions

Mô tả công việc
- Phát triển và bảo trì các dịch vụ backend sử dụng Java, Spring Boot và RESTful API.
- Thiết kế database schema, tối ưu truy vấn SQL và đảm bảo hiệu năng hệ thống.
- Phối hợp với frontend, QA và DevOps để triển khai tính năng theo sprint Agile.
- Tham gia review code, viết unit test và cải thiện chất lượng hệ thống.

Yêu cầu công việc
- Có từ 3 năm kinh nghiệm phát triển backend với Java.
- Thành thạo Spring Boot, SQL, REST API và Git.
- Có kinh nghiệm với Docker, CI/CD hoặc cloud là lợi thế.
- Tư duy giải quyết vấn đề tốt, giao tiếp rõ ràng và chủ động trong công việc.

Phúc lợi
- Lương cạnh tranh, review định kỳ.
- Môi trường kỹ thuật hiện đại, có cơ hội làm việc với hệ thống scale lớn.
- Bảo hiểm, nghỉ phép và ngân sách đào tạo hàng năm.`

const SAMPLE_USER_PROFILE: UserInput = {
  full_name: 'Nguyễn Minh Anh',
  email: 'minhanh.nguyen@example.com',
  phone: '+84 912 345 678',
  location: 'TP. Hồ Chí Minh',
  linkedin: 'linkedin.com/in/minhanh-nguyen',
  github: 'github.com/minhanhdev',
  job_title: 'Java Software Engineer',
  summary: 'Lập trình viên backend có hơn 4 năm kinh nghiệm xây dựng REST API, xử lý dữ liệu và tối ưu hiệu năng hệ thống. Có thế mạnh về Java, Spring Boot, SQL và triển khai dịch vụ bằng Docker trong môi trường Agile.',
  work_experiences: [
    {
      company: 'FPT Software',
      position: 'Backend Developer',
      start_date: '03/2022',
      end_date: 'Hiện tại',
      description: 'Phát triển hệ thống quản lý đơn hàng cho khách hàng thương mại điện tử với Java Spring Boot. Thiết kế REST API, tối ưu truy vấn PostgreSQL, viết unit test và phối hợp với DevOps triển khai Docker trên môi trường staging/production.',
    },
    {
      company: 'VietTech Labs',
      position: 'Junior Java Developer',
      start_date: '07/2020',
      end_date: '02/2022',
      description: 'Xây dựng các module backend cho ứng dụng CRM nội bộ. Tích hợp API bên thứ ba, xử lý lỗi production, viết tài liệu kỹ thuật và hỗ trợ review code cho các tính năng nhỏ.',
    },
  ],
  educations: [
    {
      school: 'Đại học Công nghệ Thông tin - ĐHQG TP.HCM',
      degree: 'Cử nhân',
      major: 'Kỹ thuật phần mềm',
      start_date: '2016',
      end_date: '2020',
      gpa: 3.45,
    },
  ],
  skills: ['Java', 'Spring Boot', 'REST API', 'PostgreSQL', 'MySQL', 'Docker', 'Git', 'JUnit', 'Agile/Scrum', 'CI/CD'],
  languages: ['Tiếng Anh - giao tiếp tốt'],
  references: 'Cung cấp khi được yêu cầu',
  certifications: [],
  projects: [],
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

export default function GenerateCVPage() {
  const [jdText, setJdText] = useState(() => {
    if (typeof window === 'undefined') return ''
    const stored = sessionStorage.getItem('selected_jd')
    if (!stored) return ''
    sessionStorage.removeItem('selected_jd')
    try {
      return buildJDText(JSON.parse(stored))
    } catch {
      return ''
    }
  })
  const [form, setForm] = useState<UserInput>({
    full_name: '', email: '', phone: '', location: '',
    linkedin: '', github: '', job_title: '', summary: '',
    work_experiences: [{ ...EMPTY_EXP }],
    educations: [{ ...EMPTY_EDU }],
    skills: [],
    languages: [],
    references: '',
    certifications: [],
    projects: [],
  })
  const [templateId, setTemplateId] = useState(CV_TEMPLATES[0].id)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [photo, setPhoto] = useState<UploadedPhoto | undefined>()
  const [outputLanguage, setOutputLanguage] = useState<'vi' | 'en'>('vi')
  const exportFormat = 'docx'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GenerateCVResponse | null>(null)

  const selectedTemplate = useMemo(
    () => CV_TEMPLATES.find((t) => t.id === templateId) ?? CV_TEMPLATES[0],
    [templateId],
  )

  const set = (field: keyof UserInput, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const loadSampleProfile = () => {
    setJdText(SAMPLE_JD_TEXT)
    setForm({
      ...SAMPLE_USER_PROFILE,
      work_experiences: SAMPLE_USER_PROFILE.work_experiences.map((item) => ({ ...item })),
      educations: SAMPLE_USER_PROFILE.educations.map((item) => ({ ...item })),
      skills: [...SAMPLE_USER_PROFILE.skills],
      languages: [...(SAMPLE_USER_PROFILE.languages ?? [])],
      certifications: SAMPLE_USER_PROFILE.certifications.map((item) => ({ ...item })),
      projects: SAMPLE_USER_PROFILE.projects.map((item) => ({
        ...item,
        tech_stack: [...(item.tech_stack ?? [])],
      })),
    })
    setSkillInput('')
    setLanguageInput('')
    setError('')
    setResult(null)
  }

  // Work experience
  const updateExp = (i: number, field: keyof WorkExperience, v: string) =>
    setForm((f) => { const a = [...f.work_experiences]; a[i] = { ...a[i], [field]: v }; return { ...f, work_experiences: a } })
  const addExp = () => setForm((f) => ({ ...f, work_experiences: [...f.work_experiences, { ...EMPTY_EXP }] }))
  const removeExp = (i: number) => setForm((f) => ({ ...f, work_experiences: f.work_experiences.filter((_, j) => j !== i) }))

  // Education
  const updateEdu = (i: number, field: keyof Education, v: string) =>
    setForm((f) => { const a = [...f.educations]; a[i] = { ...a[i], [field]: v }; return { ...f, educations: a } })
  const addEdu = () => setForm((f) => ({ ...f, educations: [...f.educations, { ...EMPTY_EDU }] }))
  const removeEdu = (i: number) => setForm((f) => ({ ...f, educations: f.educations.filter((_, j) => j !== i) }))

  // Skills
  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }))
    setSkillInput('')
  }
  const removeSkill = (s: string) => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))

  const addLanguage = () => {
    const s = languageInput.trim()
    if (s && !(form.languages ?? []).includes(s)) {
      setForm((f) => ({ ...f, languages: [...(f.languages ?? []), s] }))
    }
    setLanguageInput('')
  }
  const removeLanguage = (s: string) =>
    setForm((f) => ({ ...f, languages: (f.languages ?? []).filter((x) => x !== s) }))

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id)
    const tpl = CV_TEMPLATES.find((t) => t.id === id)
    if (!tpl?.supportsPhotoUpload) {
      setPhoto(undefined)
    }
  }

  // Certifications
  const updateCert = (i: number, field: keyof Certification, v: string) =>
    setForm((f) => { const a = [...f.certifications]; a[i] = { ...a[i], [field]: v }; return { ...f, certifications: a } })
  const addCert = () => setForm((f) => ({ ...f, certifications: [...f.certifications, { ...EMPTY_CERT }] }))
  const removeCert = (i: number) => setForm((f) => ({ ...f, certifications: f.certifications.filter((_, j) => j !== i) }))

  // Projects
  const updateProj = (i: number, field: keyof Project, v: string | string[]) =>
    setForm((f) => { const a = [...f.projects]; a[i] = { ...a[i], [field]: v }; return { ...f, projects: a } })
  const addProj = () => setForm((f) => ({ ...f, projects: [...f.projects, { ...EMPTY_PROJ }] }))
  const removeProj = (i: number) => setForm((f) => ({ ...f, projects: f.projects.filter((_, j) => j !== i) }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jdText.trim()) { setError('Vui lòng nhập mô tả công việc'); return }
    if (!form.full_name || !form.email) { setError('Họ tên và email là bắt buộc'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const templateSchema = {
        id: selectedTemplate.id as '1' | '2' | '3' | '4' | '5',
        summary_field: SUMMARY_FIELD_BY_TEMPLATE[selectedTemplate.id],
        fields: selectedTemplate.fields,
        supports_photo_upload: selectedTemplate.supportsPhotoUpload,
        instruction: `Sinh toàn bộ CV bằng ${outputLanguage === 'vi' ? 'tiếng Việt' : 'tiếng Anh sau khi dịch từ bản tiếng Việt'}, match input người dùng với JD theo logic cũ, tổng hợp thành JSON theo các field của Template ${selectedTemplate.id}, rồi render vào file mẫu.`,
      }
      const userInput: UserInput = {
        ...form,
        work_experiences: form.work_experiences.filter((x) => x.company && x.position),
        educations: form.educations.filter((x) => x.school && x.degree),
        certifications: [],
        projects: [],
        template_path: TEMPLATE_PATH_BY_ID[selectedTemplate.id],
        template_id: selectedTemplate.id,
        template_schema: templateSchema,
        photo: selectedTemplate.supportsPhotoUpload ? photo : undefined,
        output_language: outputLanguage,
        export_format: exportFormat,
      }
      const data = await api.cv.generate(jdText.trim(), userInput)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo CV thất bại')
    } finally {
      setLoading(false)
    }
  }

  function handleExportPdf() {
    const editor = document.querySelector('[data-cv-docx-editor="true"]')
    if (!editor) return

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n')
    const win = window.open('', '_blank', 'width=900,height=1100')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title></title>
          ${styles}
          <style>
            @page { margin: 0; size: A4; }
            body { margin: 0; background: #ffffff; }
            .docx-output-editor { min-height: auto !important; overflow: visible !important; padding: 0 !important; background: #ffffff !important; }
            .docx-wrapper { background: #ffffff !important; padding: 0 !important; box-shadow: none !important; }
            .docx-wrapper > section { box-shadow: none !important; margin: 0 auto !important; }
          </style>
        </head>
        <body>${editor.outerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  function handleDownloadDocx() {
    if (!result?.output_path) return
    const a = document.createElement('a')
    a.href = `/api/cv/download?path=${encodeURIComponent(result.output_path)}`
    a.download = 'cv.docx'
    a.click()
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tạo CV của bạn</h1>
            <p className="text-gray-500 mt-1">Điền thông tin và để AI tạo CV phù hợp với công việc mong muốn</p>
          </div>
          <button
            type="button"
            onClick={loadSampleProfile}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
          >
            Điền dữ liệu mẫu
          </button>
        </div>
      </div>

      <div className={result ? 'block' : 'grid grid-cols-1 gap-8 xl:grid-cols-2'}>
        {!result && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Mô tả công việc */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Mô tả công việc</h2>
            <Field label="Dán mô tả công việc vào đây" required>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={6}
                placeholder="Dán nội dung JD đầy đủ vào đây…"
                className={inp}
              />
            </Field>
          </section>

          {/* Chọn mẫu CV */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {selectedTemplate.thumbnail && (
                  <Image
                    src={selectedTemplate.thumbnail}
                    alt={selectedTemplate.name}
                    width={72}
                    height={96}
                    className="h-24 w-[72px] shrink-0 rounded-md border border-gray-200 object-cover object-top"
                  />
                )}
                <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">Mẫu CV</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Đang dùng: <span className="font-medium text-indigo-600">{selectedTemplate.name}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Field: {selectedTemplate.fields.join(', ')}
                </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatePicker(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-400 hover:text-indigo-600"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
                </svg>
                Chọn mẫu
              </button>
            </div>
          </section>

          {showTemplatePicker && (
            <TemplatePickerModal
              templates={CV_TEMPLATES}
              selected={templateId}
              onSelect={handleTemplateSelect}
              onClose={() => setShowTemplatePicker(false)}
            />
          )}

          {/* Ngôn ngữ CV */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Ngôn ngữ CV</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOutputLanguage('vi')}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                  outputLanguage === 'vi'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`block text-sm font-semibold ${outputLanguage === 'vi' ? 'text-indigo-700' : 'text-gray-700'}`}>Tiếng Việt</span>
                <span className="block text-xs text-gray-400 mt-0.5">Toàn bộ CV bằng tiếng Việt</span>
              </button>
              <button
                type="button"
                onClick={() => setOutputLanguage('en')}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                  outputLanguage === 'en'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`block text-sm font-semibold ${outputLanguage === 'en' ? 'text-indigo-700' : 'text-gray-700'}`}>English</span>
                <span className="block text-xs text-gray-400 mt-0.5">All CV content strictly in English</span>
              </button>
            </div>
          </section>

          {/* Thông tin cá nhân */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Thông tin cá nhân</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Họ và tên" required>
                <input className={inp} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Nguyễn Văn A" />
              </Field>
              <Field label="Chức danh ứng tuyển">
                <input className={inp} value={form.job_title ?? ''} onChange={(e) => set('job_title', e.target.value)} placeholder="Java Software Engineer" />
              </Field>
              <Field label="Email" required>
                <input className={inp} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="ban@example.com" />
              </Field>
              <Field label="Số điện thoại">
                <input className={inp} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+84 90 000 0000" />
              </Field>
              <Field label="Địa chỉ">
                <input className={inp} value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="TP. Hồ Chí Minh" />
              </Field>
              <Field label="LinkedIn (không bắt buộc)">
                <input className={inp} value={form.linkedin ?? ''} onChange={(e) => set('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
              </Field>
              <Field label="GitHub (không bắt buộc)">
                <input className={inp} value={form.github ?? ''} onChange={(e) => set('github', e.target.value)} placeholder="github.com/username" />
              </Field>
            </div>
            <Field label="Giới thiệu bản thân">
              <textarea
                className={inp}
                rows={3}
                value={form.summary ?? ''}
                onChange={(e) => set('summary', e.target.value)}
                placeholder="Tóm tắt ngắn về bản thân, kinh nghiệm và mục tiêu nghề nghiệp…"
              />
            </Field>
          </section>

          {/* Kinh nghiệm làm việc */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Kinh nghiệm làm việc</h2>
              <button type="button" onClick={addExp} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Thêm</button>
            </div>
            {form.work_experiences.map((exp, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Vị trí {i + 1}</span>
                  {form.work_experiences.length > 1 && (
                    <button type="button" onClick={() => removeExp(i)} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Công ty" required>
                    <input className={inp} value={exp.company} onChange={(e) => updateExp(i, 'company', e.target.value)} />
                  </Field>
                  <Field label="Vị trí" required>
                    <input className={inp} value={exp.position} onChange={(e) => updateExp(i, 'position', e.target.value)} />
                  </Field>
                  <Field label="Ngày bắt đầu">
                    <input className={inp} value={exp.start_date} onChange={(e) => updateExp(i, 'start_date', e.target.value)} placeholder="01/2022" />
                  </Field>
                  <Field label="Ngày kết thúc">
                    <input className={inp} value={exp.end_date ?? ''} onChange={(e) => updateExp(i, 'end_date', e.target.value)} placeholder="Hiện tại" />
                  </Field>
                </div>
                <Field label="Mô tả công việc">
                  <textarea className={inp} rows={3} value={exp.description} onChange={(e) => updateExp(i, 'description', e.target.value)} placeholder="Mô tả trách nhiệm và thành tích của bạn…" />
                </Field>
              </div>
            ))}
          </section>

          {/* Học vấn */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Học vấn</h2>
              <button type="button" onClick={addEdu} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Thêm</button>
            </div>
            {form.educations.map((edu, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bằng cấp {i + 1}</span>
                  {form.educations.length > 1 && (
                    <button type="button" onClick={() => removeEdu(i)} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Trường" required>
                    <input className={inp} value={edu.school} onChange={(e) => updateEdu(i, 'school', e.target.value)} />
                  </Field>
                  <Field label="Bằng cấp" required>
                    <input className={inp} value={edu.degree} onChange={(e) => updateEdu(i, 'degree', e.target.value)} placeholder="Cử nhân" />
                  </Field>
                  <Field label="Chuyên ngành">
                    <input className={inp} value={edu.major} onChange={(e) => updateEdu(i, 'major', e.target.value)} />
                  </Field>
                  <Field label="GPA">
                    <input className={inp} type="number" step="0.01" min="0" max="4" value={edu.gpa ?? ''} onChange={(e) => updateEdu(i, 'gpa', e.target.value)} placeholder="3.5" />
                  </Field>
                  <Field label="Ngày bắt đầu">
                    <input className={inp} value={edu.start_date} onChange={(e) => updateEdu(i, 'start_date', e.target.value)} placeholder="09/2018" />
                  </Field>
                  <Field label="Ngày kết thúc">
                    <input className={inp} value={edu.end_date ?? ''} onChange={(e) => updateEdu(i, 'end_date', e.target.value)} placeholder="06/2022" />
                  </Field>
                </div>
              </div>
            ))}
          </section>

          {/* Kỹ năng */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Kỹ năng</h2>
            <div className="flex gap-2">
              <input
                className={`${inp} flex-1`}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                placeholder="Nhập kỹ năng rồi nhấn Enter"
              />
              <button type="button" onClick={addSkill} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Thêm</button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <span key={s} className="flex items-center gap-1 text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="ml-1 text-indigo-400 hover:text-indigo-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Ngôn ngữ & tham chiếu</h2>
            <Field label="Ngôn ngữ">
              <div className="flex gap-2">
                <input
                  className={`${inp} flex-1`}
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLanguage() } }}
                  placeholder="Ví dụ: Tiếng Anh - IELTS 7.0"
                />
                <button type="button" onClick={addLanguage} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Thêm</button>
              </div>
              {(form.languages ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(form.languages ?? []).map((s) => (
                    <span key={s} className="flex items-center gap-1 text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                      {s}
                      <button type="button" onClick={() => removeLanguage(s)} className="ml-1 text-emerald-400 hover:text-emerald-700 leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Reference">
              <textarea
                className={inp}
                rows={3}
                value={form.references ?? ''}
                onChange={(e) => set('references', e.target.value)}
                placeholder="Thông tin người tham chiếu hoặc ghi: Cung cấp khi được yêu cầu"
              />
            </Field>
          </section>

          {/* Chứng chỉ */}
          <section className="hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Chứng chỉ <span className="text-gray-400 font-normal text-sm">(không bắt buộc)</span></h2>
              <button type="button" onClick={addCert} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Thêm</button>
            </div>
            {form.certifications.length === 0 && (
              <p className="text-sm text-gray-400 italic">Chưa có chứng chỉ nào. Nhấn &quot;+ Thêm&quot; để thêm.</p>
            )}
            {form.certifications.map((cert, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Chứng chỉ {i + 1}</span>
                  <button type="button" onClick={() => removeCert(i)} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên chứng chỉ" required>
                    <input className={inp} value={cert.name} onChange={(e) => updateCert(i, 'name', e.target.value)} placeholder="AWS Certified Developer" />
                  </Field>
                  <Field label="Tổ chức cấp">
                    <input className={inp} value={cert.issuer ?? ''} onChange={(e) => updateCert(i, 'issuer', e.target.value)} placeholder="Amazon Web Services" />
                  </Field>
                  <Field label="Ngày cấp">
                    <input className={inp} value={cert.date ?? ''} onChange={(e) => updateCert(i, 'date', e.target.value)} placeholder="06/2023" />
                  </Field>
                  <Field label="Link xác minh">
                    <input className={inp} value={cert.link ?? ''} onChange={(e) => updateCert(i, 'link', e.target.value)} placeholder="https://..." />
                  </Field>
                </div>
              </div>
            ))}
          </section>

          {/* Dự án */}
          <section className="hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Dự án <span className="text-gray-400 font-normal text-sm">(không bắt buộc)</span></h2>
              <button type="button" onClick={addProj} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Thêm</button>
            </div>

            {form.projects.map((proj, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Dự án {i + 1}</span>
                  <button type="button" onClick={() => removeProj(i)} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên dự án" required>
                    <input className={inp} value={proj.name} onChange={(e) => updateProj(i, 'name', e.target.value)} />
                  </Field>
                  <Field label="Link dự án">
                    <input className={inp} value={proj.link ?? ''} onChange={(e) => updateProj(i, 'link', e.target.value)} placeholder="https://..." />
                  </Field>
                  <Field label="Thời gian bắt đầu">
                    <input className={inp} value={proj.start_date ?? ''} onChange={(e) => updateProj(i, 'start_date', e.target.value)} placeholder="01/2023" />
                  </Field>
                  <Field label="Thời gian kết thúc">
                    <input className={inp} value={proj.end_date ?? ''} onChange={(e) => updateProj(i, 'end_date', e.target.value)} placeholder="06/2023" />
                  </Field>
                </div>
                <Field label="Mô tả dự án">
                  <textarea className={inp} rows={2} value={proj.description} onChange={(e) => updateProj(i, 'description', e.target.value)} placeholder="Mô tả ngắn về dự án, vai trò và kết quả đạt được…" />
                </Field>
                <Field label="Công nghệ sử dụng">
                  <input
                    className={inp}
                    value={(proj.tech_stack ?? []).join(', ')}
                    onChange={(e) => updateProj(i, 'tech_stack', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </Field>
              </div>
            ))}

          </section>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang tạo CV (có thể mất vài phút)…
              </span>
            ) : (
              'Tạo CV'
            )}
          </button>
        </form>
        )}

        {/* Kết quả */}
        <div className={result ? 'space-y-4' : 'self-start space-y-4 xl:sticky xl:top-20'}>
          {!result ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center py-24 text-gray-400">
              <p className="text-4xl mb-3">📄</p>
              <p className="font-medium">Kết quả sẽ hiển thị ở đây</p>
              <p className="text-sm mt-1">Điền thông tin và nhấn Tạo CV</p>
            </div>
          ) : (
            <>
            <section className="rounded-2xl border border-gray-200 bg-slate-100 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">CV editor</h2>
                  <p className="text-xs text-gray-500">Chỉnh trực tiếp trên CV đã được sinh.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                    disabled={!result.output_path}
                  >
                    Tải DOCX
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
                  >
                    Xuất PDF
                  </button>
                </div>
              </div>
              <DocxOutputEditor outputPath={result.output_path} />
            </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
