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

      {model.result ? (
        <GenerateCvResult
          result={model.result}
          onDownloadDocx={() => downloadGeneratedDocx(model.result)}
          onExportPdf={downloadCvEditorAsPdf}
          jobTitle={model.form.job_title}
          jdText={model.jdText}
          templateId={model.templateId}
        />
      ) : (
        <div className="mx-auto max-w-2xl">
          <GenerateCvForm model={model} />
        </div>
      )}
    </div>
  )
}
