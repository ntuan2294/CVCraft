'use client'

import { useEffect } from 'react'
import { GenerateCvForm } from '@/features/generate-cv/components/GenerateCvForm'
import { GenerateCvHeader } from '@/features/generate-cv/components/GenerateCvHeader'
import { GenerateCvResult } from '@/features/generate-cv/components/GenerateCvResult'
import { useGenerateCvForm } from '@/features/generate-cv/hooks/useGenerateCvForm'
import { downloadCvEditorAsImage, downloadCvEditorAsPdf, downloadGeneratedDocx } from '@/features/generate-cv/utils/export'

export default function GenerateCVPage() {
  const model = useGenerateCvForm()

  // Always start from the form view when the page mounts (e.g. duplicated tabs)
  useEffect(() => {
    model.setResult(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {model.result ? (
        <div className="space-y-8">
          <GenerateCvHeader />
          <GenerateCvResult
            result={model.result}
            onDownloadDocx={() => downloadGeneratedDocx(model.result)}
            onDownloadImage={downloadCvEditorAsImage}
            onExportPdf={downloadCvEditorAsPdf}
            jobTitle={model.form.job_title}
            jdText={model.jdText}
            templateId={model.templateId}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-8">
          <GenerateCvHeader onLoadSample={model.loadSampleProfile} />
          <GenerateCvForm model={model} />
        </div>
      )}
    </div>
  )
}
