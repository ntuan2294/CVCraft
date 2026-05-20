'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jobApi, companyApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import type { Company, JobType, ExperienceLevel, WorkMode } from '@/lib/types'

export default function PostJobPage() {
  const { user, isRecruiter } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', requirements: '', benefits: '',
    location: '', jobType: 'FULL_TIME' as JobType,
    experienceLevel: 'MID' as ExperienceLevel,
    workMode: 'HYBRID' as WorkMode,
    salaryMin: '', salaryMax: '', salaryCurrency: 'USD',
    isSalaryVisible: true, category: '',
    skills: '', deadline: '', vacancyCount: '1', companyId: '',
  })

  useEffect(() => {
    if (!user) router.push('/auth/login')
    if (user && !isRecruiter) router.push('/dashboard/candidate')
    if (user) {
      companyApi.search({}).then(r => {
        const arr = (r as { content?: Company[] }).content ?? []
        setCompanies(arr)
        if (arr.length > 0) setForm(f => ({ ...f, companyId: String(arr[0].id) }))
      }).catch(() => {})
    }
  }, [user, isRecruiter, router])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyId) { setError('Please select a company. Create one first if needed.'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        description: form.description,
        requirements: form.requirements || undefined,
        benefits: form.benefits || undefined,
        location: form.location,
        jobType: form.jobType,
        experienceLevel: form.experienceLevel,
        workMode: form.workMode,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        salaryCurrency: form.salaryCurrency,
        isSalaryVisible: form.isSalaryVisible,
        category: form.category || undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        deadline: form.deadline || undefined,
        vacancyCount: Number(form.vacancyCount),
        companyId: Number(form.companyId),
      }
      const job = await jobApi.create(payload)
      router.push(`/jobs/${job.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
        <p className="text-gray-500 text-sm mt-1">Find your next great hire</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <Section title="Basic Information">
          <FormField label="Job Title *">
            <input value={form.title} onChange={e => set('title', e.target.value)} required
              placeholder="e.g. Senior Frontend Developer"
              className="form-input" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Company *">
              {companies.length === 0 ? (
                <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-xl">
                  No company yet. <a href="/companies/create" className="text-blue-600 hover:underline">Create one first</a>
                </div>
              ) : (
                <select value={form.companyId} onChange={e => set('companyId', e.target.value)} className="form-select">
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </FormField>
            <FormField label="Location *">
              <input value={form.location} onChange={e => set('location', e.target.value)} required
                placeholder="e.g. Ho Chi Minh City" className="form-input" />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Job Type">
              <select value={form.jobType} onChange={e => set('jobType', e.target.value)} className="form-select">
                {(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] as const).map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Experience Level">
              <select value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)} className="form-select">
                {(['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR'] as const).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Work Mode">
              <select value={form.workMode} onChange={e => set('workMode', e.target.value)} className="form-select">
                {(['ONSITE', 'REMOTE', 'HYBRID'] as const).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </FormField>
          </div>
        </Section>

        {/* Salary */}
        <Section title="Salary">
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Min Salary">
              <input type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)}
                placeholder="e.g. 50000" className="form-input" />
            </FormField>
            <FormField label="Max Salary">
              <input type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)}
                placeholder="e.g. 80000" className="form-input" />
            </FormField>
            <FormField label="Currency">
              <select value={form.salaryCurrency} onChange={e => set('salaryCurrency', e.target.value)} className="form-select">
                {['USD', 'VND', 'EUR', 'SGD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" checked={form.isSalaryVisible} onChange={e => set('isSalaryVisible', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Show salary to candidates</span>
          </label>
        </Section>

        {/* Description */}
        <Section title="Job Details">
          <FormField label="Job Description *">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={6}
              placeholder="Describe the role, team, and what success looks like..."
              className="form-textarea" />
          </FormField>
          <FormField label="Requirements">
            <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} rows={4}
              placeholder="List required qualifications and experience..."
              className="form-textarea" />
          </FormField>
          <FormField label="Benefits">
            <textarea value={form.benefits} onChange={e => set('benefits', e.target.value)} rows={3}
              placeholder="What does your company offer? Health insurance, flexible hours, remote work..."
              className="form-textarea" />
          </FormField>
        </Section>

        {/* Additional */}
        <Section title="Additional Details">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <input value={form.category} onChange={e => set('category', e.target.value)}
                placeholder="e.g. Engineering, Marketing" className="form-input" />
            </FormField>
            <FormField label="Vacancies">
              <input type="number" value={form.vacancyCount} onChange={e => set('vacancyCount', e.target.value)} min="1"
                className="form-input" />
            </FormField>
          </div>
          <FormField label="Required Skills (comma-separated)">
            <input value={form.skills} onChange={e => set('skills', e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js" className="form-input" />
          </FormField>
          <FormField label="Application Deadline">
            <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="form-input" />
          </FormField>
        </Section>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-70 text-sm">
            {loading ? 'Publishing...' : 'Publish Job Post'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 text-sm">
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        .form-input { width: 100%; font-size: 0.875rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 0.875rem; outline: none; }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .form-select { width: 100%; font-size: 0.875rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 0.875rem; outline: none; background: white; }
        .form-select:focus { border-color: #3b82f6; }
        .form-textarea { width: 100%; font-size: 0.875rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 0.875rem; outline: none; resize: vertical; }
        .form-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
