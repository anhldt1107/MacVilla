import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerHeaderUser } from '../components/partner/PartnerHeaderUser'
import {
  B2B_PROJECTS_STATUS_FILTERS,
  B2B_PROJECTS_LIST,
} from '../data/b2bDashboard'

export function PartnerProjectsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  return (
    <>
      {/* Header - clone temp.html */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý Công trình</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
            <Icon name="notifications" className="text-primary text-[20px]" />
            <span className="size-2 bg-red-500 rounded-full" />
          </div>
          <div className="flex items-center pl-4 border-l border-slate-200 dark:border-slate-700">
            <PartnerHeaderUser hideTextOnMobile={false} />
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Page Title & Primary Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Danh sách công trình</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi tiến độ vật tư cho 12 dự án đang hoạt động.</p>
          </div>
          <Link
            to="/partner/projects/create"
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all shrink-0"
          >
            <Icon name="add" className="text-[20px]" />
            Tạo công trình mới
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 min-w-[300px] items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <Icon name="search" className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc mã công trình (VD: PRJ-001)..."
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Trạng thái:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {B2B_PROJECTS_STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    statusFilter === f.id
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên công trình / ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Địa điểm</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày khởi công</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tiến độ vật tư</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngân sách (Thực tế/Dự kiến)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {B2B_PROJECTS_LIST.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{row.name}</div>
                      <span className="text-[11px] font-mono text-primary bg-primary/10 inline-block px-1.5 py-0.5 rounded mt-1 uppercase">
                        {row.id}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Icon name="location_on" className="text-[16px] text-slate-400" />
                        {row.location}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${row.typeClass}`}>{row.type}</span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-200">{row.startDate}</td>
                    <td className="px-6 py-5">
                      <div className="w-32">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-bold ${row.progressClass}`}>{row.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${row.progressBarClass}`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{row.budget}</div>
                      <div className="text-[10px] text-slate-400">VNĐ (Việt Nam Đồng)</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${row.statusClass}`}>
                        {row.statusIcon ? (
                          <Icon name={row.statusIcon} className="text-[14px]" />
                        ) : (
                          <span className={`size-1.5 rounded-full ${row.statusDot}`} />
                        )}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        className="text-slate-400 hover:text-primary transition-colors p-1"
                        aria-label="Thao tác"
                      >
                        <Icon name="more_vert" className="text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 font-medium tracking-tight">Hiển thị 1 - 4 trên tổng số 12 công trình</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Icon name="chevron_left" className="text-[18px]" />
              </button>
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded border border-primary bg-primary text-white text-xs font-bold"
              >
                1
              </button>
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                2
              </button>
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                3
              </button>
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Icon name="chevron_right" className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
