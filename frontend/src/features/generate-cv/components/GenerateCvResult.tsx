import DocxOutputEditor from '@/components/DocxOutputEditor'
import type { GenerateCVResponse } from '@/lib/types'

export function GenerateCvResult({
  result,
  onDownloadDocx,
  onExportPdf,
}: {
  result: GenerateCVResponse | null
  onDownloadDocx: () => void
  onExportPdf: () => void
}) {
  return (
    <div className={result ? 'space-y-4' : 'self-start space-y-4 xl:sticky xl:top-20'}>
      {!result ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-gray-400">
          <p className="mb-3 text-4xl">📄</p>
          <p className="font-medium">Kết quả sẽ hiển thị ở đây</p>
          <p className="mt-1 text-sm">Điền thông tin và nhấn Tạo CV</p>
        </div>
      ) : (
        <section className="space-y-3 rounded-2xl border border-gray-200 bg-slate-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">CV editor</h2>
              <p className="text-xs text-gray-500">Chỉnh trực tiếp trên CV đã được sinh.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDownloadDocx}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                disabled={!result.output_path}
              >
                Tải DOCX
              </button>
              <button
                type="button"
                onClick={onExportPdf}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
              >
                Xuất PDF
              </button>
            </div>
          </div>
          <DocxOutputEditor outputPath={result.output_path} />
        </section>
      )}
    </div>
  )
}
