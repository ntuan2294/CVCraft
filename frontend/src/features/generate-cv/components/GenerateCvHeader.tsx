export function GenerateCvHeader({ onLoadSample }: { onLoadSample: () => void }) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tạo CV của bạn</h1>
          <p className="mt-1 text-gray-500">Điền thông tin và để AI tạo CV phù hợp với công việc mong muốn</p>
        </div>
        <button
          type="button"
          onClick={onLoadSample}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
        >
          Điền dữ liệu mẫu
        </button>
      </div>
    </div>
  )
}
