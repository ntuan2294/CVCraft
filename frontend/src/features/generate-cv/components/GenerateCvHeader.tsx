import { useI18n } from '@/lib/i18n'

export function GenerateCvHeader({ onLoadSample }: { onLoadSample?: () => void }) {
  const { t } = useI18n()

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {t('gen.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            {t('gen.subtitle')}
          </p>
        </div>
        {onLoadSample && (
          <div className="shrink-0 sm:mt-1">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-xs transition-all hover:border-indigo-300 hover:bg-indigo-100/80 active:scale-98"
            >
              <span>💡</span>
              {t('gen.loadSample')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
