'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { profileApi, authApi, type UpdateProfileRequest } from '@/lib/backendApi'
import type { UserProfile, WorkExperience, Education } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

const EMPTY_EXP: WorkExperience = {
  company: '',
  position: '',
  start_date: '',
  end_date: '',
  description: '',
}

const EMPTY_EDU: Education = {
  school: '',
  degree: '',
  major: '',
  start_date: '',
  end_date: '',
}

const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all text-gray-800'

export default function ProfilePage() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Lists and nested states
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  const [languages, setLanguages] = useState<string[]>([])
  const [languageInput, setLanguageInput] = useState('')

  const [referencesInfo, setReferencesInfo] = useState('')

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([])
  const [educations, setEducations] = useState<Education[]>([])

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    profileApi.getMe()
      .then(p => {
        setProfile(p)
        setFullName(p.fullName ?? '')
        setPhone(p.phone ?? '')
        setHeadline(p.headline ?? '')
        setBio(p.bio ?? '')
        setLocation(p.location ?? '')
        setSkills(p.skills ?? [])
        setLinkedinUrl(p.linkedinUrl ?? '')
        setGithubUrl(p.githubUrl ?? '')
        setPortfolioUrl(p.portfolioUrl ?? '')
        setReferencesInfo(p.referencesInfo ?? '')

        // Parse complex JSON lists safely
        try {
          setWorkExperiences(p.workExperiences ? JSON.parse(p.workExperiences) : [{ ...EMPTY_EXP }])
        } catch {
          setWorkExperiences([{ ...EMPTY_EXP }])
        }

        try {
          setEducations(p.educations ? JSON.parse(p.educations) : [{ ...EMPTY_EDU }])
        } catch {
          setEducations([{ ...EMPTY_EDU }])
        }

        try {
          setLanguages(p.languages ? JSON.parse(p.languages) : [])
        } catch {
          setLanguages([])
        }
      })
      .catch(() => setError('Không tải được profile'))
      .finally(() => setLoading(false))
  }, [user])

  // Skill management
  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setSkillInput('')
  }
  const removeSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill))

  // Language management
  const addLanguage = () => {
    const l = languageInput.trim()
    if (l && !languages.includes(l)) setLanguages(prev => [...prev, l])
    setLanguageInput('')
  }
  const removeLanguage = (language: string) => setLanguages(prev => prev.filter(l => l !== language))

  // Work Experience list modifiers
  const updateExp = (index: number, field: keyof WorkExperience, value: string) => {
    setWorkExperiences(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }
  const addExp = () => setWorkExperiences(prev => [...prev, { ...EMPTY_EXP }])
  const removeExp = (index: number) => setWorkExperiences(prev => prev.filter((_, idx) => idx !== index))

  // Education list modifiers
  const updateEdu = (index: number, field: keyof Education, value: string) => {
    setEducations(prev => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        [field]: field === 'gpa' && value ? Number(value) : value,
      }
      return copy
    })
  }
  const addEdu = () => setEducations(prev => [...prev, { ...EMPTY_EDU }])
  const removeEdu = (index: number) => setEducations(prev => prev.filter((_, idx) => idx !== index))

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (newPassword.length < 8) {
      setPwError(t('auth.passwordMin'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError(t('auth.passwordMismatch'))
      return
    }
    setPwLoading(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t('auth.changePasswordError'))
    } finally {
      setPwLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Họ và tên là trường bắt buộc')
      return
    }

    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const payload: UpdateProfileRequest = {
        fullName: fullName || undefined,
        phone: phone || undefined,
        headline: headline || undefined,
        bio: bio || undefined,
        location: location || undefined,
        skills,
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
        workExperiences: JSON.stringify(workExperiences.filter(exp => exp.company && exp.position)),
        educations: JSON.stringify(educations.filter(edu => edu.school && edu.degree)),
        languages: JSON.stringify(languages),
        referencesInfo: referencesInfo || undefined,
      }
      const updated = await profileApi.updateMe(payload)
      setProfile(updated)
      setSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa hồ sơ CV</h1>
        <p className="text-sm text-gray-500 mt-1">Thông tin này được lưu trữ và dùng để tạo CV tự động</p>
      </div>

      {/* Error / Success Status */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-700 flex items-center gap-2 font-semibold">
          <span>✓</span> Hồ sơ đã được lưu thành công vào cơ sở dữ liệu!
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Personal info */}
        <Section title={t('gen.personal')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('gen.fullName')} required>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder={t('gen.fullNamePlaceholder')} className={inputClass} maxLength={100} />
            </FormField>
            <FormField label={`${t('gen.email')} (Không thể thay đổi)`} required>
              <input value={user?.email} disabled
                className={`${inputClass} bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed`} />
            </FormField>
            <FormField label={t('gen.phone')} required>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder={t('gen.phonePlaceholder')} className={inputClass} maxLength={20} />
            </FormField>
            <FormField label={t('gen.jobTitle')} required>
              <input value={headline} onChange={e => setHeadline(e.target.value)}
                placeholder={t('gen.jobTitlePlaceholder')} className={inputClass} maxLength={200} />
            </FormField>
            <FormField label={t('gen.address')}>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder={t('gen.addressPlaceholder')} className={inputClass} />
            </FormField>
            <FormField label={t('gen.linkedin')}>
              <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                placeholder={t('gen.linkedinPlaceholder')} className={inputClass} />
            </FormField>
            <FormField label={t('gen.github')}>
              <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                placeholder={t('gen.githubPlaceholder')} className={inputClass} />
            </FormField>
            <FormField label="Portfolio / Website (Không bắt buộc)">
              <input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
                placeholder={t('gen.portfolioPlaceholder')} className={inputClass} />
            </FormField>
          </div>
          <FormField label={t('gen.summary')} required>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder={t('gen.summaryPlaceholder')}
              rows={4} className={inputClass} />
          </FormField>
        </Section>

        {/* Work Experience */}
        <Section title={t('gen.experience')} onAdd={addExp} required>
          {workExperiences.length === 0 && (
            <p className="text-sm italic text-gray-400">Chưa thêm kinh nghiệm làm việc nào.</p>
          )}
          <div className="space-y-4">
            {workExperiences.map((exp, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 relative">
                <ItemHeader label={`${t('gen.position')} ${index + 1}`} canRemove={workExperiences.length > 1} onRemove={() => removeExp(index)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label={t('gen.company')} required>
                    <input className={inputClass} value={exp.company} onChange={e => updateExp(index, 'company', e.target.value)} placeholder={t('gen.companyPlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.position')} required>
                    <input className={inputClass} value={exp.position} onChange={e => updateExp(index, 'position', e.target.value)} placeholder={t('gen.positionPlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.startDate')}>
                    <input className={inputClass} value={exp.start_date} onChange={e => updateExp(index, 'start_date', e.target.value)} placeholder={t('gen.startDatePlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.endDate')}>
                    <input className={inputClass} value={exp.end_date ?? ''} onChange={e => updateExp(index, 'end_date', e.target.value)} placeholder={t('gen.endDatePlaceholder')} />
                  </FormField>
                </div>
                <FormField label={t('gen.expDesc')}>
                  <textarea className={inputClass} rows={3} value={exp.description} onChange={e => updateExp(index, 'description', e.target.value)} placeholder={t('gen.expDescPlaceholder')} />
                </FormField>
              </div>
            ))}
          </div>
        </Section>

        {/* Education */}
        <Section title={t('gen.education')} onAdd={addEdu} required>
          {educations.length === 0 && (
            <p className="text-sm italic text-gray-400">Chưa thêm thông tin học vấn nào.</p>
          )}
          <div className="space-y-4">
            {educations.map((edu, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <ItemHeader label={`${t('gen.degree')} ${index + 1}`} canRemove={educations.length > 1} onRemove={() => removeEdu(index)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label={t('gen.school')} required>
                    <input className={inputClass} value={edu.school} onChange={e => updateEdu(index, 'school', e.target.value)} placeholder={t('gen.schoolPlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.degree')} required>
                    <input className={inputClass} value={edu.degree} onChange={e => updateEdu(index, 'degree', e.target.value)} placeholder={t('gen.degreePlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.major')}>
                    <input className={inputClass} value={edu.major} onChange={e => updateEdu(index, 'major', e.target.value)} placeholder={t('gen.majorPlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.gpa')}>
                    <input className={inputClass} type="number" step="0.01" min="0" max="4" value={edu.gpa ?? ''} onChange={e => updateEdu(index, 'gpa', e.target.value)} placeholder={t('gen.gpaPlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.startDate')}>
                    <input className={inputClass} value={edu.start_date} onChange={e => updateEdu(index, 'start_date', e.target.value)} placeholder={t('gen.startDatePlaceholder')} />
                  </FormField>
                  <FormField label={t('gen.endDate')}>
                    <input className={inputClass} value={edu.end_date ?? ''} onChange={e => updateEdu(index, 'end_date', e.target.value)} placeholder={t('gen.endDatePlaceholder')} />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Skills */}
        <Section title={t('gen.skills')} required>
          <div className="flex gap-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addSkill() }
                if (e.key === ',') { e.preventDefault(); addSkill() }
              }}
              placeholder={t('gen.skillPlaceholder')}
              className={`${inputClass} flex-1`}
            />
            <button type="button" onClick={addSkill}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shrink-0">
              {t('gen.add')}
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map(skill => (
                <Tag key={skill} label={skill} color="indigo" onRemove={() => removeSkill(skill)} />
              ))}
            </div>
          )}
        </Section>

        {/* Languages & References */}
        <Section title={t('gen.langRef')}>
          <FormField label={t('gen.langLabel')}>
            <div className="flex gap-2">
              <input value={languageInput} onChange={e => setLanguageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addLanguage() }
                }}
                placeholder={t('gen.langPlaceholder')}
                className={`${inputClass} flex-1`}
              />
              <button type="button" onClick={addLanguage}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shrink-0">
                {t('gen.add')}
              </button>
            </div>
            {languages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {languages.map(lang => (
                  <Tag key={lang} label={lang} color="emerald" onRemove={() => removeLanguage(lang)} />
                ))}
              </div>
            )}
          </FormField>

          <FormField label={t('gen.reference')}>
            <textarea
              className={inputClass}
              rows={3}
              value={referencesInfo}
              onChange={e => setReferencesInfo(e.target.value)}
              placeholder={t('gen.referencePlaceholder')}
            />
          </FormField>
        </Section>

        {/* Submit Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 text-sm shadow-sm hover:shadow">
            {saving ? 'Đang lưu hồ sơ...' : 'Lưu hồ sơ CV'}
          </button>
          <button type="button" onClick={() => router.push('/dashboard')}
            className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm text-center">
            Huỷ bỏ
          </button>
        </div>
      </form>

      {/* Change Password */}
      <div className="mt-12 pt-10 border-t border-gray-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.changePasswordTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('auth.changePasswordSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {pwError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-700 flex items-center gap-2 font-semibold">
              <span>✓</span> {t('auth.passwordChangedSuccess')}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.currentPassword')}</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                className={inputClass} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.newPassword')}</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                className={inputClass} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.confirmNewPassword')}</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8}
                className={inputClass} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={pwLoading}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 text-sm">
              {pwLoading ? t('auth.changingPassword') : t('auth.changePasswordBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Section({ title, required, onAdd, children }: { title: string; required?: boolean; onAdd?: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="font-semibold text-gray-950 text-base">
          {title}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </h2>
        {onAdd && (
          <button type="button" onClick={onAdd} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            + Thêm mới
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function ItemHeader({ label, canRemove = true, onRemove }: { label: string; canRemove?: boolean; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
          Gỡ bỏ
        </button>
      )}
    </div>
  )
}

function Tag({ label, color, onRemove }: { label: string; color: 'indigo' | 'emerald'; onRemove: () => void }) {
  const classes =
    color === 'indigo'
      ? 'bg-indigo-50 border-indigo-100 text-indigo-700 [&_button]:text-indigo-400 [&_button:hover]:text-indigo-700'
      : 'bg-emerald-50 border-emerald-100 text-emerald-700 [&_button]:text-emerald-400 [&_button:hover]:text-emerald-700'

  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-medium ${classes}`}>
      {label}
      <button type="button" onClick={onRemove} className="ml-1 text-base leading-none focus:outline-none">
        ×
      </button>
    </span>
  )
}
