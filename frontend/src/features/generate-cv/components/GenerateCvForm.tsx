import Image from 'next/image'
import TemplatePickerModal from '@/components/TemplatePickerModal'
import { CV_TEMPLATES } from '../constants'
import type { useGenerateCvForm } from '../hooks/useGenerateCvForm'
import { FormField, inputClass } from './FormField'
import { useI18n } from '@/lib/i18n'

type GenerateCvFormModel = ReturnType<typeof useGenerateCvForm>

export function GenerateCvForm({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <form onSubmit={model.handleSubmit} className="space-y-6">
      <JobDescriptionSection model={model} />
      <TemplateSection model={model} />
      <OutputLanguageSection model={model} />
      <PersonalInfoSection model={model} />
      <WorkExperienceSection model={model} />
      <EducationSection model={model} />
      <SkillsSection model={model} />
      <LanguageAndReferenceSection model={model} />
      <HiddenOptionalSections model={model} />

      {model.saveProfileSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-700 flex items-center gap-2 font-semibold">
          <span>✓</span> {t('gen.saveProfileSuccess')}
        </div>
      )}

      {model.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{model.error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={model.handleSaveToProfile}
          disabled={model.loading || model.savingProfile}
          className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50/50 py-3 text-sm font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {model.savingProfile ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600/30 border-t-indigo-600" />
              {t('gen.savingProfile')}
            </span>
          ) : (
            t('gen.saveProfile')
          )}
        </button>

        <button
          type="submit"
          disabled={model.loading || model.savingProfile}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {model.loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {model.loadingMsg || t('gen.submitting')}
            </span>
          ) : (
            t('gen.submit')
          )}
        </button>
      </div>
    </form>
  )
}

function JobDescriptionSection({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">{t('gen.jdTitle')}</h2>
      <FormField label={t('gen.jdLabel')} required>
        <textarea
          value={model.jdText}
          onChange={(event) => model.setJdText(event.target.value)}
          rows={6}
          placeholder={t('gen.jdPlaceholder')}
          className={inputClass}
        />
      </FormField>
    </section>
  )
}

function TemplateSection({ model }: { model: GenerateCvFormModel }) {
  const { selectedTemplate } = model
  const { t } = useI18n()
  const localizedTemplateName = t(`tpl.${selectedTemplate.id}.name` as any) || selectedTemplate.name

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {selectedTemplate.thumbnail && (
            <Image
              src={selectedTemplate.thumbnail}
              alt={localizedTemplateName}
              width={72}
              height={96}
              className="h-24 w-18 shrink-0 rounded-md border border-gray-200 object-cover object-top"
            />
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">{t('gen.template')}</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {t('gen.activeTemplate', { name: localizedTemplateName })}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('gen.fields', { fields: selectedTemplate.fields.join(', ') })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => model.setShowTemplatePicker(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-400 hover:text-indigo-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z"
              clipRule="evenodd"
            />
          </svg>
          {t('gen.selectTemplate')}
        </button>
      </div>

      {model.showTemplatePicker && (
        <TemplatePickerModal
          templates={CV_TEMPLATES}
          selected={model.templateId}
          onSelect={model.handleTemplateSelect}
          onClose={() => model.setShowTemplatePicker(false)}
        />
      )}
    </section>
  )
}

function OutputLanguageSection({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-semibold text-gray-900">{t('gen.cvLang')}</h2>
      <div className="flex gap-3">
        <LanguageButton
          active={model.outputLanguage === 'vi'}
          title={t('gen.langVi')}
          description={t('gen.langViDesc')}
          onClick={() => model.setOutputLanguage('vi')}
        />
        <LanguageButton
          active={model.outputLanguage === 'en'}
          title={t('gen.langEn')}
          description={t('gen.langEnDesc')}
          onClick={() => model.setOutputLanguage('en')}
        />
      </div>
    </section>
  )
}

function LanguageButton({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
        active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className={`block text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-700'}`}>{title}</span>
      <span className="mt-0.5 block text-xs text-gray-400">{description}</span>
    </button>
  )
}

function PersonalInfoSection({ model }: { model: GenerateCvFormModel }) {
  const { form } = model
  const { t } = useI18n()

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">{t('gen.personal')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('gen.fullName')} required>
          <input className={inputClass} value={form.full_name} onChange={(event) => model.setField('full_name', event.target.value)} placeholder={t('gen.fullNamePlaceholder')} />
        </FormField>
        <FormField label={t('gen.jobTitle')} required>
          <input className={inputClass} value={form.job_title ?? ''} onChange={(event) => model.setField('job_title', event.target.value)} placeholder={t('gen.jobTitlePlaceholder')} />
        </FormField>
        <FormField label={t('gen.email')} required>
          <input className={inputClass} type="email" value={form.email} onChange={(event) => model.setField('email', event.target.value)} placeholder={t('gen.emailPlaceholder')} />
        </FormField>
        <FormField label={t('gen.phone')} required>
          <input className={inputClass} value={form.phone ?? ''} onChange={(event) => model.setField('phone', event.target.value)} placeholder={t('gen.phonePlaceholder')} />
        </FormField>
        <FormField label={t('gen.address')}>
          <input className={inputClass} value={form.location ?? ''} onChange={(event) => model.setField('location', event.target.value)} placeholder={t('gen.addressPlaceholder')} />
        </FormField>
        <FormField label={t('gen.linkedin')}>
          <input className={inputClass} value={form.linkedin ?? ''} onChange={(event) => model.setField('linkedin', event.target.value)} placeholder={t('gen.linkedinPlaceholder')} />
        </FormField>
        <FormField label={t('gen.github')}>
          <input className={inputClass} value={form.github ?? ''} onChange={(event) => model.setField('github', event.target.value)} placeholder={t('gen.githubPlaceholder')} />
        </FormField>
      </div>
      <FormField label={t('gen.summary')} required>
        <textarea
          className={inputClass}
          rows={3}
          value={form.summary ?? ''}
          onChange={(event) => model.setField('summary', event.target.value)}
          placeholder={t('gen.summaryPlaceholder')}
        />
      </FormField>
    </section>
  )
}

function WorkExperienceSection({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <SectionHeader title={t('gen.experience')} onAdd={model.addExp} required />
      {model.form.work_experiences.map((exp, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <ItemHeader label={`${t('gen.position')} ${index + 1}`} canRemove={model.form.work_experiences.length > 1} onRemove={() => model.removeExp(index)} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('gen.company')} required>
              <input className={inputClass} value={exp.company} onChange={(event) => model.updateExp(index, 'company', event.target.value)} placeholder={t('gen.companyPlaceholder')} />
            </FormField>
            <FormField label={t('gen.position')} required>
              <input className={inputClass} value={exp.position} onChange={(event) => model.updateExp(index, 'position', event.target.value)} placeholder={t('gen.positionPlaceholder')} />
            </FormField>
            <FormField label={t('gen.startDate')}>
              <input className={inputClass} value={exp.start_date} onChange={(event) => model.updateExp(index, 'start_date', event.target.value)} placeholder={t('gen.startDatePlaceholder')} />
            </FormField>
            <FormField label={t('gen.endDate')}>
              <input className={inputClass} value={exp.end_date ?? ''} onChange={(event) => model.updateExp(index, 'end_date', event.target.value)} placeholder={t('gen.endDatePlaceholder')} />
            </FormField>
          </div>
          <FormField label={t('gen.expDesc')}>
            <textarea className={inputClass} rows={3} value={exp.description} onChange={(event) => model.updateExp(index, 'description', event.target.value)} placeholder={t('gen.expDescPlaceholder')} />
          </FormField>
        </div>
      ))}
    </section>
  )
}

function EducationSection({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <SectionHeader title={t('gen.education')} onAdd={model.addEdu} required />
      {model.form.educations.map((edu, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <ItemHeader label={`${t('gen.degree')} ${index + 1}`} canRemove={model.form.educations.length > 1} onRemove={() => model.removeEdu(index)} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('gen.school')} required>
              <input className={inputClass} value={edu.school} onChange={(event) => model.updateEdu(index, 'school', event.target.value)} placeholder={t('gen.schoolPlaceholder')} />
            </FormField>
            <FormField label={t('gen.degree')} required>
              <input className={inputClass} value={edu.degree} onChange={(event) => model.updateEdu(index, 'degree', event.target.value)} placeholder={t('gen.degreePlaceholder')} />
            </FormField>
            <FormField label={t('gen.major')}>
              <input className={inputClass} value={edu.major} onChange={(event) => model.updateEdu(index, 'major', event.target.value)} placeholder={t('gen.majorPlaceholder')} />
            </FormField>
            <FormField label={t('gen.gpa')}>
              <input className={inputClass} type="number" step="0.01" min="0" max="4" value={edu.gpa ?? ''} onChange={(event) => model.updateEdu(index, 'gpa', event.target.value)} placeholder={t('gen.gpaPlaceholder')} />
            </FormField>
            <FormField label={t('gen.startDate')}>
              <input className={inputClass} value={edu.start_date} onChange={(event) => model.updateEdu(index, 'start_date', event.target.value)} placeholder={t('gen.startDatePlaceholder')} />
            </FormField>
            <FormField label={t('gen.endDate')}>
              <input className={inputClass} value={edu.end_date ?? ''} onChange={(event) => model.updateEdu(index, 'end_date', event.target.value)} placeholder={t('gen.endDatePlaceholder')} />
            </FormField>
          </div>
        </div>
      ))}
    </section>
  )
}

function SkillsSection({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">
        {t('gen.skills')}
        <span className="ml-0.5 text-red-500">*</span>
      </h2>
      <TagInput value={model.skillInput} onChange={model.setSkillInput} onAdd={model.addSkill} placeholder={t('gen.skillPlaceholder')} />
      {model.form.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {model.form.skills.map((skill) => (
            <Tag key={skill} label={skill} color="indigo" onRemove={() => model.removeSkill(skill)} />
          ))}
        </div>
      )}
    </section>
  )
}

function LanguageAndReferenceSection({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">{t('gen.langRef')}</h2>
      <FormField label={t('gen.langLabel')}>
        <TagInput value={model.languageInput} onChange={model.setLanguageInput} onAdd={model.addLanguage} placeholder={t('gen.langPlaceholder')} />
        {(model.form.languages ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(model.form.languages ?? []).map((language) => (
              <Tag key={language} label={language} color="emerald" onRemove={() => model.removeLanguage(language)} />
            ))}
          </div>
        )}
      </FormField>
      <FormField label={t('gen.reference')}>
        <textarea
          className={inputClass}
          rows={3}
          value={model.form.references ?? ''}
          onChange={(event) => model.setField('references', event.target.value)}
          placeholder={t('gen.referencePlaceholder')}
        />
      </FormField>
    </section>
  )
}

function HiddenOptionalSections({ model }: { model: GenerateCvFormModel }) {
  const { t } = useI18n()

  return (
    <>
      <section className="hidden">
        <SectionHeader title={t('gen.certifications')} onAdd={model.addCert} suffix={t('gen.certSuffix')} />
        {model.form.certifications.length === 0 && <p className="text-sm italic text-gray-400">{t('gen.certPlaceholder')}</p>}
        {model.form.certifications.map((cert, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <ItemHeader label={`${t('gen.certifications')} ${index + 1}`} canRemove onRemove={() => model.removeCert(index)} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t('gen.certName')} required>
                <input className={inputClass} value={cert.name} onChange={(event) => model.updateCert(index, 'name', event.target.value)} placeholder="AWS Certified Developer" />
              </FormField>
              <FormField label={t('gen.certIssuer')}>
                <input className={inputClass} value={cert.issuer ?? ''} onChange={(event) => model.updateCert(index, 'issuer', event.target.value)} placeholder="Amazon Web Services" />
              </FormField>
              <FormField label={t('gen.certDate')}>
                <input className={inputClass} value={cert.date ?? ''} onChange={(event) => model.updateCert(index, 'date', event.target.value)} placeholder="06/2023" />
              </FormField>
              <FormField label={t('gen.certLink')}>
                <input className={inputClass} value={cert.link ?? ''} onChange={(event) => model.updateCert(index, 'link', event.target.value)} placeholder="https://..." />
              </FormField>
            </div>
          </div>
        ))}
      </section>

      <section className="hidden">
        <SectionHeader title={t('gen.projects')} onAdd={model.addProj} suffix={t('gen.projSuffix')} />
        {model.form.projects.map((proj, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <ItemHeader label={`${t('gen.projects')} ${index + 1}`} canRemove onRemove={() => model.removeProj(index)} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t('gen.projName')} required>
                <input className={inputClass} value={proj.name} onChange={(event) => model.updateProj(index, 'name', event.target.value)} />
              </FormField>
              <FormField label={t('gen.projLink')}>
                <input className={inputClass} value={proj.link ?? ''} onChange={(event) => model.updateProj(index, 'link', event.target.value)} placeholder="https://..." />
              </FormField>
              <FormField label={t('gen.startDate')}>
                <input className={inputClass} value={proj.start_date ?? ''} onChange={(event) => model.updateProj(index, 'start_date', event.target.value)} placeholder="01/2023" />
              </FormField>
              <FormField label={t('gen.endDate')}>
                <input className={inputClass} value={proj.end_date ?? ''} onChange={(event) => model.updateProj(index, 'end_date', event.target.value)} placeholder="06/2023" />
              </FormField>
            </div>
            <FormField label={t('gen.projDesc')}>
              <textarea className={inputClass} rows={2} value={proj.description} onChange={(event) => model.updateProj(index, 'description', event.target.value)} placeholder={t('gen.projDescPlaceholder')} />
            </FormField>
            <FormField label={t('gen.techStack')}>
              <input
                className={inputClass}
                value={(proj.tech_stack ?? []).join(', ')}
                onChange={(event) => model.updateProj(index, 'tech_stack', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
                placeholder={t('gen.techStackPlaceholder')}
              />
            </FormField>
          </div>
        ))}
      </section>
    </>
  )
}

function SectionHeader({ title, required, suffix, onAdd }: { title: string; required?: boolean; suffix?: string; onAdd: () => void }) {
  const { t } = useI18n()

  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold text-gray-900">
        {title} {suffix && <span className="text-sm font-normal text-gray-400">{suffix}</span>}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </h2>
      <button type="button" onClick={onAdd} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
        + {t('gen.add')}
      </button>
    </div>
  )
}

function ItemHeader({ label, canRemove, onRemove }: { label: string; canRemove: boolean; onRemove: () => void }) {
  const { t } = useI18n()

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-xs text-red-400 hover:text-red-600">
          {t('gen.remove')}
        </button>
      )}
    </div>
  )
}

function TagInput({ value, onChange, onAdd, placeholder }: { value: string; onChange: (value: string) => void; onAdd: () => void; placeholder: string }) {
  const { t } = useI18n()

  return (
    <div className="flex gap-2">
      <input
        className={`${inputClass} flex-1`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onAdd()
          }
        }}
        placeholder={placeholder}
      />
      <button type="button" onClick={onAdd} className="rounded-lg bg-gray-100 px-4 py-2 text-sm transition-colors hover:bg-gray-200">
        {t('gen.add')}
      </button>
    </div>
  )
}

function Tag({ label, color, onRemove }: { label: string; color: 'indigo' | 'emerald'; onRemove: () => void }) {
  const classes =
    color === 'indigo'
      ? 'bg-indigo-100 text-indigo-700 [&_button]:text-indigo-400 [&_button:hover]:text-indigo-700'
      : 'bg-emerald-50 text-emerald-700 [&_button]:text-emerald-400 [&_button:hover]:text-emerald-700'

  return (
    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${classes}`}>
      {label}
      <button type="button" onClick={onRemove} className="ml-1 leading-none">
        ×
      </button>
    </span>
  )
}
