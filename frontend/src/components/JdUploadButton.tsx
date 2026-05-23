'use client'

import { useRef, useState } from 'react'

interface Props {
  onExtracted: (text: string) => void
}

const ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg'

export default function JdUploadButton({ onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!inputRef.current) return
    inputRef.current.value = ''
    if (!file) return

    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/cv/extract-jd', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'Không đọc được file')
      onExtracted(data.text as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi đọc file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
            Đang đọc...
          </>
        ) : (
          <>
            📎 Tải JD
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleChange}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
