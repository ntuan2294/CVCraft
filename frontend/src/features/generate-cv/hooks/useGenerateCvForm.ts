'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { buildJDText } from '@/lib/jd'
import { profileApi, cvTemplateApi, type UpdateProfileRequest } from '@/lib/backendApi'
import type { CVTemplate } from '@/components/TemplatePickerModal'
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
  const [templates, setTemplates] = useState<CVTemplate[]>(CV_TEMPLATES)
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
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true
    cvTemplateApi.getAll()
      .then(data => {
        if (!isMounted) return
        if (data && data.length > 0) {
          const mapped: CVTemplate[] = data.map(t => ({
            id: String(t.id),
            name: t.name,
            description: t.description || '',
            fields: t.fields,
            supportsPhotoUpload: t.supportsPhotoUpload,
            summaryLabel: t.summaryLabel || 'Profile',
            thumbnail: t.thumbnail || ''
          }))
          setTemplates(mapped)
          if (!mapped.some(t => t.id === templateId)) {
            setTemplateId(mapped[0].id)
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load CV templates from database, falling back to static constants:', err)
      })
    return () => { isMounted = false }
  }, [templateId])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0],
    [templateId, templates],
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
    const template = templates.find((item) => item.id === id)
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
      const summaryField = SUMMARY_FIELD_BY_TEMPLATE[selectedTemplate.id] ||
        (selectedTemplate.summaryLabel?.toLowerCase().includes('about') ? 'about_me' :
         selectedTemplate.summaryLabel?.toLowerCase().includes('personal') ? 'personal_summary' :
         selectedTemplate.summaryLabel?.toLowerCase().includes('summary') ? 'summary' : 'profile')
      const templatePath = TEMPLATE_PATH_BY_ID[selectedTemplate.id] || `template cv/${selectedTemplate.id}.docx`
      const exportFormat = templatePath.toLowerCase().endsWith('.html') ? 'html' : 'docx'

      const templateSchema = {
        id: selectedTemplate.id,
        summary_field: summaryField,
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
        template_path: templatePath,
        template_id: selectedTemplate.id,
        template_schema: templateSchema,
        photo: selectedTemplate.supportsPhotoUpload ? photo : undefined,
        output_language: outputLanguage,
        export_format: exportFormat,
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

  const loadFromProfile = async () => {
    setLoading(true)
    setLoadingMsg('Đang tải thông tin từ hồ sơ...')
    setError('')
    try {
      const p = await profileApi.getMe()
      
      let workExperiences = [{ ...EMPTY_EXP }]
      try {
        if (p.workExperiences) {
          const parsed = JSON.parse(p.workExperiences)
          if (Array.isArray(parsed) && parsed.length > 0) {
            workExperiences = parsed
          }
        }
      } catch {}

      let educations = [{ ...EMPTY_EDU }]
      try {
        if (p.educations) {
          const parsed = JSON.parse(p.educations)
          if (Array.isArray(parsed) && parsed.length > 0) {
            educations = parsed
          }
        }
      } catch {}

      let languagesArr: string[] = []
      try {
        if (p.languages) {
          languagesArr = JSON.parse(p.languages)
        }
      } catch {}

      setForm({
        full_name: p.fullName ?? '',
        email: p.email ?? '',
        phone: p.phone ?? '',
        location: p.location ?? '',
        linkedin: p.linkedinUrl ?? '',
        github: p.githubUrl ?? '',
        job_title: p.headline ?? '',
        summary: p.bio ?? '',
        work_experiences: workExperiences,
        educations: educations,
        skills: p.skills ?? [],
        languages: languagesArr,
        references: p.referencesInfo ?? '',
        certifications: [],
        projects: [],
      })
      
      setSkillInput('')
      setLanguageInput('')
      setResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lấy được thông tin hồ sơ. Vui lòng đăng nhập.')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  const handleSaveToProfile = async () => {
    setSavingProfile(true)
    setError('')
    setSaveProfileSuccess(false)
    try {
      const payload: UpdateProfileRequest = {
        fullName: form.full_name || undefined,
        phone: form.phone || undefined,
        headline: form.job_title || undefined,
        bio: form.summary || undefined,
        location: form.location || undefined,
        skills: form.skills,
        linkedinUrl: form.linkedin || undefined,
        githubUrl: form.github || undefined,
        workExperiences: JSON.stringify(form.work_experiences.filter(exp => exp.company && exp.position)),
        educations: JSON.stringify(form.educations.filter(edu => edu.school && edu.degree)),
        languages: JSON.stringify(form.languages ?? []),
        referencesInfo: form.references || undefined,
      }
      await profileApi.updateMe(payload)
      setSaveProfileSuccess(true)
      setTimeout(() => setSaveProfileSuccess(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu hồ sơ thất bại. Vui lòng đăng nhập.')
    } finally {
      setSavingProfile(false)
    }
  }

  return {
    jdText,
    setJdText,
    form,
    setField,
    templates,
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
    setResult,
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
    loadFromProfile,
    savingProfile,
    saveProfileSuccess,
    handleSaveToProfile,
  }
}
