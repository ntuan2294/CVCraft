'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { JDSearchResponse, JDSearchResult } from '@/lib/types'
import JDResultCard from '@/components/JDResultCard'

const PAGE_SIZE = 5

export default function JDSearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<JDSearchResponse | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [page, setPage] = useState(1)

  const totalResults = result?.top_jds.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))
  const pageStart = (page - 1) * PAGE_SIZE
  const pageItems = result?.top_jds.slice(pageStart, pageStart + PAGE_SIZE) ?? []

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.jd.search(query.trim())
      setResult(data)
      setSelectedIdx(0)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tìm kiếm thất bại')
    } finally {
      setLoading(false)
    }
  }

  function handleGenerate(jdResult: JDSearchResult) {
    sessionStorage.setItem('selected_jd', JSON.stringify(jdResult.jd))
    router.push('/generate')
  }

  return (
    <div className="space-y-8 bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-950">Tìm kiếm cơ hội nghề nghiệp</h1>
      </div>

      <form onSubmit={handleSearch} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập yêu cầu của bạn"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-gray-950 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang tìm…' : 'Tìm kiếm'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <div className="mr-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          Đang tìm kiếm…
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-600">
            {result.top_jds.length > 0
              ? <>{result.top_jds.length} kết quả phù hợp cho <strong>&quot;{result.query}&quot;</strong></>
              : <>Không tìm thấy JD phù hợp</>
            }
            </p>
            {totalResults > PAGE_SIZE && (
              <p className="text-sm text-gray-500">
                Trang {page}/{totalPages} · Hiển thị {pageItems.length} JD
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pageItems.map((r, i) => {
              const absoluteIndex = pageStart + i
              return (
              <JDResultCard
                key={r.jd.id}
                jd={r.jd}
                selected={selectedIdx === absoluteIndex}
                onSelect={() => setSelectedIdx(absoluteIndex)}
                onGenerate={() => handleGenerate(r)}
              />
              )
            })}
          </div>

          {totalResults > PAGE_SIZE && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="py-20 text-center text-gray-400">
          <p className="text-lg font-medium">Tìm kiếm mô tả công việc để bắt đầu</p>
          <p className="mt-1 text-sm">Nhập yêu cầu của bạn vào thanh tìm kiếm</p>
        </div>
      )}
    </div>
  )
}
