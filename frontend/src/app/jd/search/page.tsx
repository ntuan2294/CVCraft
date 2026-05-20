'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import type { JDSearchResponse, JDDocument } from '@/lib/types'
import JDResultCard from '@/components/JDResultCard'

export default function JDSearchPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JDDocument[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const data: JDSearchResponse = await api.jd.search(query)
      setResults(data.top_jds.map(r => r.jd))
      setSearched(true)
    } catch {
      setError(t('jd.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-sm text-blue-700 mb-4">
          <span>🔍</span> {t('jd.badge')}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('jd.title')}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">{t('jd.desc')}</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-2xl mx-auto">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <svg className="w-5 h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={t('jd.placeholder')}
            className="w-full text-sm focus:outline-none text-gray-900 placeholder-gray-400" />
        </div>
        <button type="submit" disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-2xl transition-colors disabled:opacity-70 text-sm whitespace-nowrap shadow-sm">
          {loading ? t('jd.searching') : t('jd.search')}
        </button>
      </form>

      {!searched && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">💡</div>
          <p className="text-gray-500 text-sm">{t('jd.tip')}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {['Software Engineer', 'Product Manager', 'Data Analyst', 'DevOps Engineer', 'UX Designer'].map(q => (
              <button key={q} onClick={() => setQuery(q)}
                className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-full transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('jd.noResults')}</h3>
          <p className="text-gray-500 text-sm">{t('jd.noResultsHint')}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">{t('jd.results', { n: results.length })}</p>
          {results.map((jd, i) => (
            <JDResultCard
              key={jd.id ?? i}
              jd={jd}
              selected={selectedId === (jd.id ?? String(i))}
              onSelect={() => setSelectedId(jd.id ?? String(i))}
              onGenerate={() => router.push('/cv/generate')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
