import Image from 'next/image'
import TemplatePickerModal from '@/components/TemplatePickerModal'
import { CV_TEMPLATES } from '../constants'
import type { useGenerateCvForm } from '../hooks/useGenerateCvForm'
import { FormField, inputClass } from './FormField'

type GenerateCvFormModel = ReturnType<typeof useGenerateCvForm>

export function GenerateCvForm({ model }: { model: GenerateCvFormModel }) {
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

      {model.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{model.error}</div>
      )}

      <button
        type="submit"
        disabled={model.loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {model.loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Đang tạo CV (có thể mất vài phút)…
          </span>
        ) : (
          'Tạo CV'
        )}
      </button>
    </form>
  )
}

function JobDescriptionSection({ model }: { model: GenerateCvFormModel }) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">Mô tả công việc</h2>
      <FormField label="Dán mô tả công việc vào đây" required>
        <textarea
          value={model.jdText}
          onChange={(event) => model.setJdText(event.target.value)}
          rows={6}
          placeholder="Dán nội dung JD đầy đủ vào đây…"
          className={inputClass}
        />
      </FormField>
    </section>
  )
}

function TemplateSection({ model }: { model: GenerateCvFormModel }) {
  const { selectedTemplate } = model

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {selectedTemplate.thumbnail && (
            <Image
              src={selectedTemplate.thumbnail}
              alt={selectedTemplate.name}
              width={72}
              height={96}
              className="h-24 w-18 shrink-0 rounded-md border border-gray-200 object-cover object-top"
            />
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">Mẫu CV</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Đang dùng: <span className="font-medium text-indigo-600">{selectedTemplate.name}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">Field: {selectedTemplate.fields.join(', ')}</p>
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
          Chọn mẫu
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
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-semibold text-gray-900">Ngôn ngữ CV</h2>
      <div className="flex gap-3">
        <LanguageButton
          active={model.outputLanguage === 'vi'}
          title="Tiếng Việt"
          description="Toàn bộ CV bằng tiếng Việt"
          onClick={() => model.setOutputLanguage('vi')}
        />
        <LanguageButton
          active={model.outputLanguage === 'en'}
          title="English"
          description="All CV content strictly in English"
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

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">Thông tin cá nhân</h2>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Họ và tên" required>
          <input className={inputClass} value={form.full_name} onChange={(event) => model.setField('full_name', event.target.value)} placeholder="Nguyễn Văn A" />
        </FormField>
        <FormField label="Chức danh ứng tuyển">
          <input className={inputClass} value={form.job_title ?? ''} onChange={(event) => model.setField('job_title', event.target.value)} placeholder="Java Software Engineer" />
        </FormField>
        <FormField label="Email" required>
          <input className={inputClass} type="email" value={form.email} onChange={(event) => model.setField('email', event.target.value)} placeholder="ban@example.com" />
        </FormField>
        <FormField label="Số điện thoại">
          <input className={inputClass} value={form.phone ?? ''} onChange={(event) => model.setField('phone', event.target.value)} placeholder="+84 90 000 0000" />
        </FormField>
        <FormField label="Địa chỉ">
          <input className={inputClass} value={form.location ?? ''} onChange={(event) => model.setField('location', event.target.value)} placeholder="TP. Hồ Chí Minh" />
        </FormField>
        <FormField label="LinkedIn (không bắt buộc)">
          <input className={inputClass} value={form.linkedin ?? ''} onChange={(event) => model.setField('linkedin', event.target.value)} placeholder="linkedin.com/in/..." />
        </FormField>
        <FormField label="GitHub (không bắt buộc)">
          <input className={inputClass} value={form.github ?? ''} onChange={(event) => model.setField('github', event.target.value)} placeholder="github.com/username" />
        </FormField>
      </div>
      <FormField label="Giới thiệu bản thân">
        <textarea
          className={inputClass}
          rows={3}
          value={form.summary ?? ''}
          onChange={(event) => model.setField('summary', event.target.value)}
          placeholder="Tóm tắt ngắn về bản thân, kinh nghiệm và mục tiêu nghề nghiệp…"
        />
      </FormField>
    </section>
  )
}

function WorkExperienceSection({ model }: { model: GenerateCvFormModel }) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <SectionHeader title="Kinh nghiệm làm việc" onAdd={model.addExp} />
      {model.form.work_experiences.map((exp, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <ItemHeader label={`Vị trí ${index + 1}`} canRemove={model.form.work_experiences.length > 1} onRemove={() => model.removeExp(index)} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Công ty" required>
              <input className={inputClass} value={exp.company} onChange={(event) => model.updateExp(index, 'company', event.target.value)} />
            </FormField>
            <FormField label="Vị trí" required>
              <input className={inputClass} value={exp.position} onChange={(event) => model.updateExp(index, 'position', event.target.value)} />
            </FormField>
            <FormField label="Ngày bắt đầu">
              <input className={inputClass} value={exp.start_date} onChange={(event) => model.updateExp(index, 'start_date', event.target.value)} placeholder="01/2022" />
            </FormField>
            <FormField label="Ngày kết thúc">
              <input className={inputClass} value={exp.end_date ?? ''} onChange={(event) => model.updateExp(index, 'end_date', event.target.value)} placeholder="Hiện tại" />
            </FormField>
          </div>
          <FormField label="Mô tả công việc">
            <textarea className={inputClass} rows={3} value={exp.description} onChange={(event) => model.updateExp(index, 'description', event.target.value)} placeholder="Mô tả trách nhiệm và thành tích của bạn…" />
          </FormField>
        </div>
      ))}
    </section>
  )
}

function EducationSection({ model }: { model: GenerateCvFormModel }) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <SectionHeader title="Học vấn" onAdd={model.addEdu} />
      {model.form.educations.map((edu, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <ItemHeader label={`Bằng cấp ${index + 1}`} canRemove={model.form.educations.length > 1} onRemove={() => model.removeEdu(index)} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Trường" required>
              <input className={inputClass} value={edu.school} onChange={(event) => model.updateEdu(index, 'school', event.target.value)} />
            </FormField>
            <FormField label="Bằng cấp" required>
              <input className={inputClass} value={edu.degree} onChange={(event) => model.updateEdu(index, 'degree', event.target.value)} placeholder="Cử nhân" />
            </FormField>
            <FormField label="Chuyên ngành">
              <input className={inputClass} value={edu.major} onChange={(event) => model.updateEdu(index, 'major', event.target.value)} />
            </FormField>
            <FormField label="GPA">
              <input className={inputClass} type="number" step="0.01" min="0" max="4" value={edu.gpa ?? ''} onChange={(event) => model.updateEdu(index, 'gpa', event.target.value)} placeholder="3.5" />
            </FormField>
            <FormField label="Ngày bắt đầu">
              <input className={inputClass} value={edu.start_date} onChange={(event) => model.updateEdu(index, 'start_date', event.target.value)} placeholder="09/2018" />
            </FormField>
            <FormField label="Ngày kết thúc">
              <input className={inputClass} value={edu.end_date ?? ''} onChange={(event) => model.updateEdu(index, 'end_date', event.target.value)} placeholder="06/2022" />
            </FormField>
          </div>
        </div>
      ))}
    </section>
  )
}

function SkillsSection({ model }: { model: GenerateCvFormModel }) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">Kỹ năng</h2>
      <TagInput value={model.skillInput} onChange={model.setSkillInput} onAdd={model.addSkill} placeholder="Nhập kỹ năng rồi nhấn Enter" />
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
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">Ngôn ngữ & tham chiếu</h2>
      <FormField label="Ngôn ngữ">
        <TagInput value={model.languageInput} onChange={model.setLanguageInput} onAdd={model.addLanguage} placeholder="Ví dụ: Tiếng Anh - IELTS 7.0" />
        {(model.form.languages ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(model.form.languages ?? []).map((language) => (
              <Tag key={language} label={language} color="emerald" onRemove={() => model.removeLanguage(language)} />
            ))}
          </div>
        )}
      </FormField>
      <FormField label="Reference">
        <textarea
          className={inputClass}
          rows={3}
          value={model.form.references ?? ''}
          onChange={(event) => model.setField('references', event.target.value)}
          placeholder="Thông tin người tham chiếu hoặc ghi: Cung cấp khi được yêu cầu"
        />
      </FormField>
    </section>
  )
}

function HiddenOptionalSections({ model }: { model: GenerateCvFormModel }) {
  return (
    <>
      <section className="hidden">
        <SectionHeader title="Chứng chỉ" onAdd={model.addCert} suffix="(không bắt buộc)" />
        {model.form.certifications.length === 0 && <p className="text-sm italic text-gray-400">Chưa có chứng chỉ nào. Nhấn &quot;+ Thêm&quot; để thêm.</p>}
        {model.form.certifications.map((cert, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <ItemHeader label={`Chứng chỉ ${index + 1}`} canRemove onRemove={() => model.removeCert(index)} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tên chứng chỉ" required>
                <input className={inputClass} value={cert.name} onChange={(event) => model.updateCert(index, 'name', event.target.value)} placeholder="AWS Certified Developer" />
              </FormField>
              <FormField label="Tổ chức cấp">
                <input className={inputClass} value={cert.issuer ?? ''} onChange={(event) => model.updateCert(index, 'issuer', event.target.value)} placeholder="Amazon Web Services" />
              </FormField>
              <FormField label="Ngày cấp">
                <input className={inputClass} value={cert.date ?? ''} onChange={(event) => model.updateCert(index, 'date', event.target.value)} placeholder="06/2023" />
              </FormField>
              <FormField label="Link xác minh">
                <input className={inputClass} value={cert.link ?? ''} onChange={(event) => model.updateCert(index, 'link', event.target.value)} placeholder="https://..." />
              </FormField>
            </div>
          </div>
        ))}
      </section>

      <section className="hidden">
        <SectionHeader title="Dự án" onAdd={model.addProj} suffix="(không bắt buộc)" />
        {model.form.projects.map((proj, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <ItemHeader label={`Dự án ${index + 1}`} canRemove onRemove={() => model.removeProj(index)} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tên dự án" required>
                <input className={inputClass} value={proj.name} onChange={(event) => model.updateProj(index, 'name', event.target.value)} />
              </FormField>
              <FormField label="Link dự án">
                <input className={inputClass} value={proj.link ?? ''} onChange={(event) => model.updateProj(index, 'link', event.target.value)} placeholder="https://..." />
              </FormField>
              <FormField label="Thời gian bắt đầu">
                <input className={inputClass} value={proj.start_date ?? ''} onChange={(event) => model.updateProj(index, 'start_date', event.target.value)} placeholder="01/2023" />
              </FormField>
              <FormField label="Thời gian kết thúc">
                <input className={inputClass} value={proj.end_date ?? ''} onChange={(event) => model.updateProj(index, 'end_date', event.target.value)} placeholder="06/2023" />
              </FormField>
            </div>
            <FormField label="Mô tả dự án">
              <textarea className={inputClass} rows={2} value={proj.description} onChange={(event) => model.updateProj(index, 'description', event.target.value)} placeholder="Mô tả ngắn về dự án, vai trò và kết quả đạt được…" />
            </FormField>
            <FormField label="Công nghệ sử dụng">
              <input
                className={inputClass}
                value={(proj.tech_stack ?? []).join(', ')}
                onChange={(event) => model.updateProj(index, 'tech_stack', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
                placeholder="React, Node.js, PostgreSQL"
              />
            </FormField>
          </div>
        ))}
      </section>
    </>
  )
}

function SectionHeader({ title, suffix, onAdd }: { title: string; suffix?: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold text-gray-900">
        {title} {suffix && <span className="text-sm font-normal text-gray-400">{suffix}</span>}
      </h2>
      <button type="button" onClick={onAdd} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
        + Thêm
      </button>
    </div>
  )
}

function ItemHeader({ label, canRemove, onRemove }: { label: string; canRemove: boolean; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-xs text-red-400 hover:text-red-600">
          Xóa
        </button>
      )}
    </div>
  )
}

function TagInput({ value, onChange, onAdd, placeholder }: { value: string; onChange: (value: string) => void; onAdd: () => void; placeholder: string }) {
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
        Thêm
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
