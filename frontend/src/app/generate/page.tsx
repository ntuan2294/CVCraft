'use client'

import { GenerateCvForm } from '@/features/generate-cv/components/GenerateCvForm'
import { GenerateCvHeader } from '@/features/generate-cv/components/GenerateCvHeader'
import { GenerateCvResult } from '@/features/generate-cv/components/GenerateCvResult'
import { useGenerateCvForm } from '@/features/generate-cv/hooks/useGenerateCvForm'
import { downloadCvEditorAsPdf, downloadGeneratedDocx } from '@/features/generate-cv/utils/export'

export default function GenerateCVPage() {
  const model = useGenerateCvForm()

  return (
    <div className="space-y-8">
      <GenerateCvHeader onLoadSample={model.loadSampleProfile} />

      <div className={model.result ? 'block' : 'grid grid-cols-1 gap-8 xl:grid-cols-2'}>
        {!model.result && <GenerateCvForm model={model} />}
        <GenerateCvResult
          result={model.result}
          onDownloadDocx={() => downloadGeneratedDocx(model.result)}
          onExportPdf={downloadCvEditorAsPdf}
          jobTitle={model.form.job_title}
          jdText={model.jdText}
          templateId={model.templateId}
        />
      </div>
    </div>
  )
}
