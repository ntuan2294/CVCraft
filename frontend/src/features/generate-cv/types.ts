import type { GenerateCVResponse, UserInput } from '@/lib/types'
import type { CVTemplate } from '@/components/TemplatePickerModal'

export type OutputLanguage = 'vi' | 'en'

export interface GenerateCvFormState {
  jdText: string
  form: UserInput
  selectedTemplate: CVTemplate
  templateId: string
  showTemplatePicker: boolean
  skillInput: string
  languageInput: string
  outputLanguage: OutputLanguage
  loading: boolean
  error: string
  result: GenerateCVResponse | null
}
