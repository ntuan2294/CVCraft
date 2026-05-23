'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { useI18n } from '@/lib/i18n'

export interface CVTemplate {
  id: string
  name: string
  description: string
  fields: string[]
  supportsPhotoUpload: boolean
  summaryLabel: string
  thumbnail?: string
}

interface Props {
  templates: CVTemplate[]
  selected: string
  onSelect: (id: string) => void
  onClose: () => void
}

export default function TemplatePickerModal({ templates, selected, onSelect, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[95vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('gen.selectTemplate')}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{t('gen.selectTemplateDesc')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={t('gen.close')}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2 2xl:grid-cols-3">
            {templates.map((tpl) => {
              const isSelected = selected === tpl.id
              const localizedName = t(`tpl.${tpl.id}.name` as Parameters<typeof t>[0]) || tpl.name
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => { onSelect(tpl.id); onClose() }}
                  className={`group flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                    isSelected
                      ? 'border-indigo-500 shadow-md shadow-indigo-100'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {/* Thumbnail area */}
                  <div className={`relative flex h-[560px] items-center justify-center ${isSelected ? 'bg-indigo-50' : 'bg-gray-50 group-hover:bg-indigo-50/50'}`}>
                    {tpl.thumbnail ? (
                      <Image
                        src={tpl.thumbnail}
                        alt={localizedName}
                        width={340}
                        height={480}
                        className="h-[510px] w-[360px] rounded-md border border-slate-200 bg-white object-cover object-top shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-[510px] w-[360px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                        <div className="h-full w-full bg-slate-100" />
                      </div>
                    )}
                    {isSelected && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="currentColor">
                          <path d="M10.28 2.28 3.989 8.575 1.695 6.28A1 1 0 0 0 .28 7.695l3 3a1 1 0 0 0 1.414 0l7-7A1 1 0 0 0 10.28 2.28Z" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-3 py-3 text-center">
                    <p className={`text-base font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {localizedName}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
