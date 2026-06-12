import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerHeaderUser } from '../components/partner/PartnerHeaderUser'
import { B2B_QUOTATION_HISTORY_TABS } from '../data/b2bDashboard'
import { storeB2bFetchQuotes } from '../api/store/storeB2bQuotesApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  quoteStatusLabel,
  statusBadgeClass,
  quoteMatchesHistoryTab,
  normalizeQuotationStatus,
  QUOTATION_HISTORY_STATUS_FILTER_KEYS,
} from '../lib/quotationStatus'
import { useAuth } from '../contexts/AuthContext'

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

function formatQuoteDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PartnerQuotationHistoryPage() {
  const { accessToken, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const clearedSubmitRef = useRef(false)
  const [submitBanner, setSubmitBanner] = useState(
    /** @type {{ quoteCode?: string, quoteId?: number } | null} */ (null)
  )
  const [activeTab, setActiveTab] = useState('all')
  const [headerSearch, setHeaderSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [filterStatus, setFilterStatus] = useState('Tất cả trạng thái')

  const [page, setPage] = useState(1)
  const pageSize = 20
  const [quotesItems, setQuotesItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const apiStatusFilter =
    filterStatus === 'Tất cả trạng thái' ? undefined : filterStatus.trim()

  const loadQuotes = useCallback(async () => {
    if (!accessToken) {
      setQuotesItems([])
      setTotalCount(0)
      setLoading(false)
      setLoadError('')
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const data = await storeB2bFetchQuotes(accessToken, {
        page,
        pageSize,
        ...(apiStatusFilter ? { status: apiStatusFilter } : {}),
      })
      setQuotesItems(data.items ?? [])
      setTotalCount(data.totalCount ?? 0)
    } catch (err) {
      setLoadError(getApiErrorMessage(err))
      setQuotesItems([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, pageSize, apiStatusFilter])

  useEffect(() => {
    void loadQuotes()
  }, [loadQuotes])

  useEffect(() => {
    const st = location.state
    if (st?.quoteSubmitted && !clearedSubmitRef.current) {
      setSubmitBanner({ quoteCode: st.quoteCode, quoteId: st.quoteId })
      clearedSubmitRef.current = true
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
    }
  }, [location, navigate])

  const statusOptions = useMemo(() => {
    const fromApi = new Set(
      quotesItems.map((i) => normalizeQuotationStatus(i.status)).filter(Boolean)
    )
    const extras = [...fromApi].filter(
      (k) => !QUOTATION_HISTORY_STATUS_FILTER_KEYS.includes(k)
    )
    extras.sort()
    return ['Tất cả trạng thái', ...QUOTATION_HISTORY_STATUS_FILTER_KEYS, ...extras]
  }, [quotesItems])

  const displayedItems = useMemo(() => {
    let rows = quotesItems.filter((r) => quoteMatchesHistoryTab(r.status, activeTab))
    const q = `${headerSearch} ${filterProject}`.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.quoteCode && r.quoteCode.toLowerCase().includes(q)) ||
          String(r.id).includes(q)
      )
    }
    return rows
  }, [quotesItems, activeTab, headerSearch, filterProject])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeFrom =
    totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo = Math.min(page * pageSize, totalCount)

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Quotation</span>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Lịch sử báo giá
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64 max-w-[40vw] hidden sm:block">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
            />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Tìm mã báo giá..."
              className="w-full pl-10 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
          <button
            type="button"
            className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            aria-label="Thông báo"
          >
            <Icon name="notifications" className="text-xl" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>
          <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
            <PartnerHeaderUser />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Lịch sử báo giá
              </h1>
            </div>
            <Link
              to="/partner/quotation/create"
              className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-all w-fit"
            >
              <Icon name="add" className="text-lg" />
              Tạo báo giá mới
            </Link>
          </div>

          {!isAuthenticated || !accessToken ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Vui lòng{' '}
              <Link to="/login" className="font-bold underline">
                đăng nhập doanh nghiệp
              </Link>{' '}
              để xem danh sách báo giá.
            </div>
          ) : null}

          {submitBanner ? (
            <div
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-2"
              role="status"
            >
              <span className="font-semibold">
                Đã gửi báo giá
                {submitBanner.quoteCode ? (
                  <>
                    {' '}(<strong className="font-mono">{submitBanner.quoteCode}</strong>)
                  </>
                ) : null}
              </span>
              <button
                type="button"
                className="text-sm font-bold text-primary hover:underline"
                onClick={() => setSubmitBanner(null)}
              >
                Đóng
              </button>
            </div>
          ) : null}

          {loadError ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap items-center justify-between gap-2"
              role="alert"
            >
              {loadError}
              <button
                type="button"
                onClick={() => void loadQuotes()}
                className="text-sm font-bold text-primary hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : null}

          <div className="border-b border-slate-200 dark:border-slate-800">
            <nav className="flex gap-6 sm:gap-8 flex-wrap">
              {B2B_QUOTATION_HISTORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'font-bold text-primary border-b-2 border-primary'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Mã / ID
              </label>
              <div className="relative">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                />
                <input
                  type="text"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  placeholder="Lọc trên trang hiện tại..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Khoảng thời gian
              </label>
              <div className="relative">
                <Icon
                  name="calendar_today"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                />
                <input
                  type="text"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  placeholder="Sắp có"
                  disabled
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-100"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Tất cả trạng thái'
                      ? opt
                      : quoteStatusLabel(opt)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onClick={() => {
                  setFilterProject('')
                  setFilterPeriod('')
                  setFilterStatus('Tất cả trạng thái')
                  setHeaderSearch('')
                  setActiveTab('all')
                  setPage(1)
                }}
              >
                Thiết lập lại
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mã báo giá
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Dòng hàng
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Tổng giá trị
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        Đang tải danh sách…
                      </td>
                    </tr>
                  ) : null}
                  {!loading && displayedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        Không có báo giá phù hợp.
                      </td>
                    </tr>
                  ) : null}
                  {!loading
                    ? displayedItems.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-primary whitespace-nowrap">
                            {row.quoteCode}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {row.lineCount}{' '}
                              {row.lineCount === 1 ? 'dòng' : 'dòng'}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID #{row.id}
                              {row.salesName
                                ? ` · ${row.salesName}`
                                : ''}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatQuoteDate(row.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatMoneyVnd(row.finalAmount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(row.status)}`}
                            >
                              {quoteStatusLabel(row.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/partner/quotation/${encodeURIComponent(row.quoteCode)}`}
                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                                title="Xem chi tiết"
                              >
                                <Icon name="visibility" className="text-lg" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500">
                Hiển thị{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {totalCount === 0 ? 0 : `${rangeFrom}-${rangeTo}`}
                </span>{' '}
                trong số{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {totalCount}
                </span>{' '}
                báo giá
                {displayedItems.length !== quotesItems.length ? (
                  <span className="text-slate-400">
                    {' '}
                    ({displayedItems.length} sau lọc trên trang)
                  </span>
                ) : null}
              </p>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300"
                  disabled={page >= totalPages || loading || totalCount === 0}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
