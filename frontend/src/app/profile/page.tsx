'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { profileApi, type UpdateProfileRequest } from '@/lib/backendApi'
import type { UserProfile, ExperienceLevel } from '@/lib/types'

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR']
const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  INTERN: 'Thực tập sinh', JUNIOR: 'Junior (0–2 năm)', MID: 'Mid (2–5 năm)',
  SENIOR: 'Senior (5–8 năm)', LEAD: 'Lead / Tech Lead', MANAGER: 'Manager', DIRECTOR: 'Director',
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    profileApi.getMe()
      .then(p => {
        setProfile(p)
        setHeadline(p.headline ?? '')
        setBio(p.bio ?? '')
        setLocation(p.location ?? '')
        setExperienceYears(p.experienceYears?.toString() ?? '')
        setExperienceLevel(p.experienceLevel ?? '')
        setSkills(p.skills ?? [])
        setLinkedinUrl(p.linkedinUrl ?? '')
        setGithubUrl(p.githubUrl ?? '')
        setPortfolioUrl(p.portfolioUrl ?? '')
      })
      .catch(() => setError('Không tải được profile'))
      .finally(() => setLoading(false))
  }, [user])

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setSkillInput('')
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
    if (e.key === ',') { e.preventDefault(); addSkill() }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const payload: UpdateProfileRequest = {
        headline: headline || undefined,
        bio: bio || undefined,
        location: location || undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        experienceLevel: experienceLevel || undefined,
        skills,
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      }
      const updated = await profileApi.updateMe(payload)
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Thông tin này được dùng để tạo CV nhanh hơn</p>
      </div>

      {/* User info (readonly) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.fullName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {profile?.createdAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Tham gia từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic info */}
        <Section title="Thông tin cơ bản">
          <Field label="Tiêu đề nghề nghiệp" hint="VD: Senior Frontend Developer | React & TypeScript">
            <input value={headline} onChange={e => setHeadline(e.target.value)}
              placeholder="Senior Frontend Developer | React & TypeScript"
              className={inputCls} maxLength={200} />
          </Field>
          <Field label="Giới thiệu bản thân">
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Mô tả ngắn về bản thân, thế mạnh, mục tiêu nghề nghiệp..."
              rows={3} className={inputCls} />
          </Field>
          <Field label="Địa điểm">
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="VD: Hà Nội, TP. Hồ Chí Minh, Remote..."
              className={inputCls} />
          </Field>
        </Section>

        {/* Experience */}
        <Section title="Kinh nghiệm">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số năm kinh nghiệm">
              <input type="number" min={0} max={50} value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
                placeholder="0" className={inputCls} />
            </Field>
            <Field label="Cấp độ">
              <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value as ExperienceLevel)}
                className={inputCls}>
                <option value="">-- Chọn cấp độ --</option>
                {EXPERIENCE_LEVELS.map(l => (
                  <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* Skills */}
        <Section title="Kỹ năng">
          <div className="flex gap-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Nhập kỹ năng rồi nhấn Enter hoặc dấu phẩy"
              className={`${inputCls} flex-1`} />
            <button type="button" onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shrink-0">
              Thêm
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                  {skill}
                  <button type="button" onClick={() => setSkills(prev => prev.filter(s => s !== skill))}
                    className="text-blue-400 hover:text-blue-700 text-xs font-bold leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Links */}
        <Section title="Liên kết">
          <Field label="LinkedIn" hint="https://linkedin.com/in/...">
            <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username" type="url"
              className={inputCls} />
          </Field>
          <Field label="GitHub" hint="https://github.com/...">
            <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username" type="url"
              className={inputCls} />
          </Field>
          <Field label="Portfolio / Website">
            <input value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.com" type="url"
              className={inputCls} />
          </Field>
        </Section>

        {/* Error / Success */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {saved && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <span>✓</span> Profile đã được lưu thành công!
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 text-sm">
            {saving ? 'Đang lưu...' : 'Lưu profile'}
          </button>
          <button type="button" onClick={() => router.push('/dashboard')}
            className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Huỷ
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 text-base border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="text-xs text-gray-400 font-normal ml-2">{hint}</span>}
      </label>
      {children}
    </div>
  )
}
