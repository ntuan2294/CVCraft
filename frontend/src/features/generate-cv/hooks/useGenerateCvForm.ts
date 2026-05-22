'use client'

import { useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { buildJDText } from '@/lib/jd'
import type {
  Certification,
  Education,
  GenerateCVResponse,
  Project,
  UploadedPhoto,
  UserInput,
  WorkExperience,
} from '@/lib/types'
import {
  CV_TEMPLATES,
  EMPTY_CERT,
  EMPTY_EDU,
  EMPTY_EXP,
  EMPTY_PROJ,
  SAMPLE_JD_TEXT,
  SAMPLE_USER_PROFILE,
  SUMMARY_FIELD_BY_TEMPLATE,
  TEMPLATE_PATH_BY_ID,
} from '../constants'
import type { OutputLanguage } from '../types'

const initialForm: UserInput = {
  full_name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  job_title: '',
  summary: '',
  work_experiences: [{ ...EMPTY_EXP }],
  educations: [{ ...EMPTY_EDU }],
  skills: [],
  languages: [],
  references: '',
  certifications: [],
  projects: [],
}

function getInitialJdText() {
  if (typeof window === 'undefined') return ''

  const stored = sessionStorage.getItem('selected_jd')
  if (!stored) return ''

  sessionStorage.removeItem('selected_jd')
  try {
    return buildJDText(JSON.parse(stored))
  } catch {
    return ''
  }
}

export function useGenerateCvForm() {
  const [jdText, setJdText] = useState(getInitialJdText)
  const [form, setForm] = useState<UserInput>(initialForm)
  const [templateId, setTemplateId] = useState(CV_TEMPLATES[0].id)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [photo, setPhoto] = useState<UploadedPhoto | undefined>()
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('vi')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<GenerateCVResponse | null>(null)

  const selectedTemplate = useMemo(
    () => CV_TEMPLATES.find((template) => template.id === templateId) ?? CV_TEMPLATES[0],
    [templateId],
  )

  const setField = (field: keyof UserInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

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

  const updateExp = (index: number, field: keyof WorkExperience, value: string) => {
    setForm((current) => {
      const workExperiences = [...current.work_experiences]
      workExperiences[index] = { ...workExperiences[index], [field]: value }
      return { ...current, work_experiences: workExperiences }
    })
  }
  const addExp = () => setForm((current) => ({ ...current, work_experiences: [...current.work_experiences, { ...EMPTY_EXP }] }))
  const removeExp = (index: number) =>
    setForm((current) => ({ ...current, work_experiences: current.work_experiences.filter((_, itemIndex) => itemIndex !== index) }))

  const updateEdu = (index: number, field: keyof Education, value: string) => {
    setForm((current) => {
      const educations = [...current.educations]
      educations[index] = {
        ...educations[index],
        [field]: field === 'gpa' && value ? Number(value) : value,
      }
      return { ...current, educations }
    })
  }
  const addEdu = () => setForm((current) => ({ ...current, educations: [...current.educations, { ...EMPTY_EDU }] }))
  const removeEdu = (index: number) =>
    setForm((current) => ({ ...current, educations: current.educations.filter((_, itemIndex) => itemIndex !== index) }))

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !form.skills.includes(skill)) {
      setForm((current) => ({ ...current, skills: [...current.skills, skill] }))
    }
    setSkillInput('')
  }
  const removeSkill = (skill: string) => setForm((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }))

  const addLanguage = () => {
    const language = languageInput.trim()
    if (language && !(form.languages ?? []).includes(language)) {
      setForm((current) => ({ ...current, languages: [...(current.languages ?? []), language] }))
    }
    setLanguageInput('')
  }
  const removeLanguage = (language: string) =>
    setForm((current) => ({ ...current, languages: (current.languages ?? []).filter((item) => item !== language) }))

  const updateCert = (index: number, field: keyof Certification, value: string) => {
    setForm((current) => {
      const certifications = [...current.certifications]
      certifications[index] = { ...certifications[index], [field]: value }
      return { ...current, certifications }
    })
  }
  const addCert = () => setForm((current) => ({ ...current, certifications: [...current.certifications, { ...EMPTY_CERT }] }))
  const removeCert = (index: number) =>
    setForm((current) => ({ ...current, certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index) }))

  const updateProj = (index: number, field: keyof Project, value: string | string[]) => {
    setForm((current) => {
      const projects = [...current.projects]
      projects[index] = { ...projects[index], [field]: value }
      return { ...current, projects }
    })
  }
  const addProj = () => setForm((current) => ({ ...current, projects: [...current.projects, { ...EMPTY_PROJ }] }))
  const removeProj = (index: number) =>
    setForm((current) => ({ ...current, projects: current.projects.filter((_, itemIndex) => itemIndex !== index) }))

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id)
    const template = CV_TEMPLATES.find((item) => item.id === id)
    if (!template?.supportsPhotoUpload) {
      setPhoto(undefined)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!jdText.trim()) {
      setError('Vui lòng nhập mô tả công việc')
      return
    }
    if (!form.full_name || !form.email) {
      setError('Họ tên và email là bắt buộc')
      return
    }

    setLoading(true)
    setLoadingMsg('Đang khởi động...')
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
        work_experiences: form.work_experiences.filter((item) => item.company && item.position),
        educations: form.educations.filter((item) => item.school && item.degree),
        certifications: [],
        projects: [],
        template_path: TEMPLATE_PATH_BY_ID[selectedTemplate.id],
        template_id: selectedTemplate.id,
        template_schema: templateSchema,
        photo: selectedTemplate.supportsPhotoUpload ? photo : undefined,
        output_language: outputLanguage,
        export_format: 'docx',
      }

      const { task_id } = await api.cv.generateAsync(jdText.trim(), userInput)

      const phases = [
        { until: 8, msg: 'Đang phân tích JD...' },
        { until: 20, msg: 'Đang viết nội dung CV...' },
        { until: 35, msg: 'Đang kiểm tra chất lượng ATS...' },
        { until: Infinity, msg: 'Đang hoàn thiện...' },
      ]
      const start = Date.now()

      while (true) {
        await new Promise<void>((r) => setTimeout(r, 1000))
        const elapsed = Math.round((Date.now() - start) / 1000)
        const phase = phases.find((p) => elapsed < p.until)?.msg ?? 'Đang xử lý...'
        setLoadingMsg(`${phase} (${elapsed}s)`)

        const task = await api.cv.getTask(task_id)
        if (task.status === 'done' && task.result) {
          setResult(task.result)
          break
        }
        if (task.status === 'failed') {
          throw new Error(task.error ?? 'Tạo CV thất bại')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo CV thất bại')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  return {
    jdText,
    setJdText,
    form,
    setField,
    selectedTemplate,
    templateId,
    showTemplatePicker,
    setShowTemplatePicker,
    skillInput,
    setSkillInput,
    languageInput,
    setLanguageInput,
    outputLanguage,
    setOutputLanguage,
    loading,
    loadingMsg,
    error,
    result,
    loadSampleProfile,
    updateExp,
    addExp,
    removeExp,
    updateEdu,
    addEdu,
    removeEdu,
    addSkill,
    removeSkill,
    addLanguage,
    removeLanguage,
    updateCert,
    addCert,
    removeCert,
    updateProj,
    addProj,
    removeProj,
    handleTemplateSelect,
    handleSubmit,
  }
}
