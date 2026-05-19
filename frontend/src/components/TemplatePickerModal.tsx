'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

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
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chọn mẫu CV</h2>
            <p className="mt-0.5 text-sm text-gray-500">Chọn mẫu phù hợp với phong cách của bạn</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Đóng"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const isSelected = selected === tpl.id
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => { onSelect(tpl.id); onClose() }}
                className={`group flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 shadow-md shadow-indigo-100'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {/* Thumbnail area */}
                <div className={`relative flex h-56 items-center justify-center ${isSelected ? 'bg-indigo-50' : 'bg-gray-50 group-hover:bg-indigo-50/50'}`}>
                  {tpl.thumbnail ? (
                    <Image
                      src={tpl.thumbnail}
                      alt={tpl.name}
                      width={160}
                      height={220}
                      className="h-52 w-36 rounded-md border border-slate-200 bg-white object-cover object-top shadow-sm"
                    />
                  ) : (
                    <div className="h-44 w-32 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
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
                <div className="flex-1 px-3 py-2.5">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {tpl.name}
                  </p>
                  <p className="mt-0.5 text-xs leading-4 text-gray-500">{tpl.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}
