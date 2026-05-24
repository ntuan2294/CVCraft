'use client'

import { useEffect } from 'react'
import { GenerateCvForm } from '@/features/generate-cv/components/GenerateCvForm'
import { GenerateCvHeader } from '@/features/generate-cv/components/GenerateCvHeader'
import { GenerateCvResult } from '@/features/generate-cv/components/GenerateCvResult'
import { useGenerateCvForm } from '@/features/generate-cv/hooks/useGenerateCvForm'
import { downloadCvEditorAsImage, downloadCvEditorAsPdf } from '@/features/generate-cv/utils/export'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function GenerateCVPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const model = useGenerateCvForm()

  // Always start from the form view when the page mounts (e.g. duplicated tabs)
  useEffect(() => {
    model.setResult(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {model.result ? (
        <div className="space-y-8">
          <GenerateCvHeader />
          <GenerateCvResult
            result={model.result}
            onDownload={(format) => {
              if (format === 'pdf') return downloadCvEditorAsPdf()
              return downloadCvEditorAsImage(format)
            }}
            jobTitle={model.form.job_title}
            jdText={model.jdText}
            templateId={model.templateId}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-8">
          <GenerateCvHeader
            onLoadSample={model.loadSampleProfile}
            onLoadProfile={model.loadFromProfile}
            loadingProfile={model.loading && model.loadingMsg.includes('hồ sơ')}
          />
          <GenerateCvForm model={model} />
        </div>
      )}
    </div>
  )
}
