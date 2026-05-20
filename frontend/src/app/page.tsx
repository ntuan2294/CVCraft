'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { JDSearchResponse, JDSearchResult } from '@/lib/types'
import JDResultCard from '@/components/JDResultCard'

const PAGE_SIZE = 5

const SUGGESTED_CHIPS = [
  'Software Engineer',
  'Product Manager',
  'Data Analyst',
  'DevOps Engineer',
  'UX Designer',
]

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

  async function doSearch(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await api.jd.search(q.trim())
      setResult(data)
      setSelectedIdx(0)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Make sure the JD Search service is running.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault()
    doSearch(query)
  }

  function handleChip(chip: string) {
    setQuery(chip)
    doSearch(chip)
  }

  function handleGenerate(jdResult: JDSearchResult) {
    sessionStorage.setItem('selected_jd', JSON.stringify(jdResult.jd))
    router.push('/generate')
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-white px-4 pb-10 pt-16 text-center sm:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
            </svg>
            AI-Powered JD Search
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            Find the Perfect Job Description
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-500">
            Search through thousands of job descriptions using semantic AI. Get formatted,
            structured JDs ready for your CV generation.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-100 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
            <div className="flex flex-1 items-center gap-3 px-4">
              <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="backend"
                className="flex-1 py-4 text-base text-gray-950 outline-none placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="m-1.5 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Searching…' : 'Search Jobs'}
            </button>
          </form>

          {/* Hint */}
          {!result && !loading && (
            <p className="text-sm text-gray-400">
              Try searching for roles like &ldquo;React Developer&rdquo;, &ldquo;Data Engineer&rdquo;, or &ldquo;UX Designer&rdquo;
            </p>
          )}

          {/* Chips */}
          {!result && !loading && (
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChip(chip)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results area */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <div className="mr-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            Searching…
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                {result.top_jds.length > 0
                  ? <>{result.top_jds.length} results for <strong>&quot;{result.query}&quot;</strong></>
                  : <>No matching JDs found</>
                }
              </p>
              {totalResults > PAGE_SIZE && (
                <p className="text-sm text-gray-500">
                  Page {page}/{totalPages} · Showing {pageItems.length} JDs
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
                  onClick={() => setPage((c) => Math.max(1, c - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}
