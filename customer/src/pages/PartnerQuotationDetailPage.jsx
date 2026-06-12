import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import {
  storeB2bFetchQuoteByCode,
  storeB2bPostCounterOffer,
  storeB2bPostQuoteAccept,
  storeB2bPostQuoteReject,
} from '../api/store/storeB2bQuotesApi'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../lib/auth/mapValidationErrors'
import {
  quoteStatusLabel,
  statusBadgeClass,
  quotationStatusCustomerNotice,
  normalizeQuotationStatus,
} from '../lib/quotationStatus'
import { useAuth } from '../contexts/AuthContext'
import { resolveStoreMediaUrl } from '../lib/catalog/resolveStoreMediaUrl'

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const inputClass =
  'w-full min-w-0 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary'

/**
 * Phản hồi thương lượng (counter-offer) khi báo giá Approved.
 * @param {{
 *   data: Record<string, unknown> & { id: number, lines?: object[], status?: string }
 *   accessToken: string
 *   onSubmitted: () => void | Promise<void>
 *   onAccepted?: () => void
 * }} props
 */
function QuotationCounterOfferPanel({ data, accessToken, onSubmitted, onAccepted }) {
  const lines = useMemo(() => {
    const raw = data?.lines
    return Array.isArray(raw) ? raw : []
  }, [data])

  const [message, setMessage] = useState('')
  const [rows, setRows] = useState(
    /** @type {{ variantId: number, desiredQuantity: number, desiredUnitPrice: number, label: string, sku: string }[]} */ (
      []
    )
  )
  const [busy, setBusy] = useState(/** @type {null | 'counter' | 'accept' | 'reject'} */ (null))
  const [formError, setFormError] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    setRows(
      lines.map((row) => ({
        variantId: Number(row.variantId),
        desiredQuantity: Math.max(1, Math.floor(Number(row.quantity)) || 1),
        desiredUnitPrice: Number(row.unitPrice) || 0,
        label: [row.productName, row.variantName].filter(Boolean).join(' · ') || `Biến thể #${row.variantId}`,
        sku: row.currentSku || '',
      }))
    )
    setMessage('')
    setFormError('')
    setRejectOpen(false)
    setRejectReason('')
  }, [lines, data.id, data.status])

  const updateRow = (index, field, raw) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r
        if (field === 'desiredQuantity') {
          const n = Math.max(1, Math.floor(Number(raw)) || 1)
          return { ...r, desiredQuantity: n }
        }
        if (field === 'desiredUnitPrice') {
          const n = Number(String(raw).replace(/\s/g, '').replace(',', '.')) || 0
          return { ...r, desiredUnitPrice: Math.max(0, n) }
        }
        return r
      })
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!message.trim()) {
      setFormError('Vui lòng nhập nội dung phản hồi (ví dụ: đề xuất chiết khấu, điều chỉnh giá/số lượng).')
      return
    }
    setBusy('counter')
    try {
      await storeB2bPostCounterOffer(accessToken, data.id, {
        message: message.trim(),
        items:
          rows.length > 0
            ? rows.map((r) => ({
                variantId: r.variantId,
                desiredQuantity: r.desiredQuantity,
                desiredUnitPrice: r.desiredUnitPrice,
              }))
            : [],
      })
      await onSubmitted()
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        const fe = mapValidationErrorsToFirstMessage(err.errors)
        const first = Object.values(fe)[0]
        setFormError(first || getApiErrorMessage(err))
      } else {
        setFormError(getApiErrorMessage(err))
      }
    } finally {
      setBusy(null)
    }
  }

  const mapErr = (err) => {
    if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
      const fe = mapValidationErrorsToFirstMessage(err.errors)
      const first = Object.values(fe)[0]
      return first || getApiErrorMessage(err)
    }
    return getApiErrorMessage(err)
  }

  const handleAccept = async () => {
    setFormError('')
    setBusy('accept')
    try {
      await storeB2bPostQuoteAccept(accessToken, data.id)
      if (onAccepted) {
        onAccepted()
      } else {
        await onSubmitted()
      }
    } catch (err) {
      setFormError(mapErr(err))
    } finally {
      setBusy(null)
    }
  }

  const handleReject = async () => {
    setFormError('')
    setBusy('reject')
    try {
      await storeB2bPostQuoteReject(accessToken, data.id, {
        reason: rejectReason,
      })
      await onSubmitted()
    } catch (err) {
      setFormError(mapErr(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-amber-100 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="forum" className="text-xl text-amber-700 dark:text-amber-400" />
          Phản hồi & thương lượng
        </h3>
      </div>
      {formError ? (
        <div className="px-6 pt-6">
          <div
            className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
            role="alert"
          >
            {formError}
          </div>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className={`p-6 space-y-5 ${formError ? 'pt-4' : ''}`}>
        <div>
          <label htmlFor="co-message" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Nội dung phản hồi
          </label>
          <textarea
            id="co-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nội dung phản hồi hoặc ghi đề giá/số lượng bên dưới."
            className={`${inputClass} resize-y min-h-[88px]`}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm min-w-[560px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3 w-28">SL đề xuất</th>
                <th className="px-4 py-3 w-36">Đơn giá đề xuất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, idx) => (
                <tr key={`${r.variantId}-${idx}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{r.label}</p>
                    {r.sku ? (
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{r.sku}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={r.desiredQuantity}
                      onChange={(e) => updateRow(idx, 'desiredQuantity', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={r.desiredUnitPrice}
                      onChange={(e) => updateRow(idx, 'desiredUnitPrice', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy != null}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {busy === 'counter' ? 'Đang gửi…' : 'Gửi đề xuất'}
          </button>
          <button
            type="button"
            disabled={busy != null}
            onClick={() => void handleAccept()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            <Icon name="check_circle" className="text-lg" />
            {busy === 'accept' ? 'Đang xử lý…' : 'Chấp nhận báo giá'}
          </button>
          <button
            type="button"
            disabled={busy != null}
            onClick={() => {
              setFormError('')
              setRejectOpen((o) => !o)
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-60 transition-colors"
          >
            <Icon name="cancel" className="text-lg" />
            Từ chối báo giá
          </button>
        </div>
      </form>

      {rejectOpen ? (
        <div className="px-6 pb-6 space-y-3 -mt-2">
          <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-3">
            <label htmlFor="reject-reason" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lý do từ chối
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do ngắn gọn."
              className={`${inputClass} resize-y min-h-[88px]`}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy != null}
                onClick={() => void handleReject()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
              >
                {busy === 'reject' ? 'Đang gửi…' : 'Xác nhận từ chối'}
              </button>
              <button
                type="button"
                disabled={busy != null}
                onClick={() => {
                  setRejectOpen(false)
                  setRejectReason('')
                  setFormError('')
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-60"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function quotationNoticeSurface(tone) {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100'
    case 'warning':
      return 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-amber-900 dark:text-amber-100'
    case 'danger':
      return 'border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 text-red-800 dark:text-red-200'
    default:
      return 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
  }
}

/** @param {{ data: { status?: string, quoteCode?: string } }} props */
function QuotationStatusBanner({ data }) {
  const notice = quotationStatusCustomerNotice(data.status)
  if (!notice) return null
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm mb-8 ${quotationNoticeSurface(notice.tone)}`}
    >
      {notice.text}
      {normalizeQuotationStatus(data.status) === 'Requested' ? (
        <span>
          {' '}
          Mã tham chiếu:{' '}
          <strong className="text-primary">{data.quoteCode}</strong>.
        </span>
      ) : null}
    </div>
  )
}

export function PartnerQuotationDetailPage() {
  /** Route param chứa quoteCode (ví dụ QT20260412402783) */
  const { quotationId: quoteCodeParam } = useParams()
  const quoteCode = quoteCodeParam ? decodeURIComponent(quoteCodeParam) : ''
  const navigate = useNavigate()
  const { accessToken, isAuthenticated } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!quoteCode?.trim()) {
      setError('Thiếu mã báo giá trên URL.')
      setData(null)
      setLoading(false)
      return
    }
    if (!accessToken) {
      setError('Vui lòng đăng nhập tài khoản doanh nghiệp.')
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const d = await storeB2bFetchQuoteByCode(accessToken, quoteCode)
      setData(d)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken, quoteCode])

  useEffect(() => {
    void load()
  }, [load])

  const lines = data?.lines ?? []

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
        <Link to="/partner" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <Icon name="chevron_right" className="text-sm shrink-0" />
        <Link
          to="/partner/quotation/history"
          className="hover:text-primary transition-colors"
        >
          Quản lý báo giá
        </Link>
        <Icon name="chevron_right" className="text-sm shrink-0" />
        <span className="text-slate-900 dark:text-white font-medium truncate">
          {quoteCode || 'Chi tiết'}
        </span>
      </nav>

      {loading ? (
        <p className="text-slate-500 text-center py-16">Đang tải chi tiết báo giá…</p>
      ) : null}

      {!loading && error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 mb-6 flex flex-wrap items-center justify-between gap-2"
          role="alert"
        >
          {error}
          {isAuthenticated && accessToken ? (
            <button
              type="button"
              onClick={() => void load()}
              className="font-bold text-primary hover:underline"
            >
              Thử lại
            </button>
          ) : (
            <Link to="/login" className="font-bold text-primary hover:underline">
              Đăng nhập
            </Link>
          )}
        </div>
      ) : null}

      {!loading && data ? (
        <>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {data.quoteCode}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(data.status)}`}
                >
                  {quoteStatusLabel(data.status)}
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                ID #{data.id} · Tạo lúc {formatDateTime(data.createdAt)}
              </p>
            </div>
          </div>

          <QuotationStatusBanner data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                    Ngày tạo
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {formatDateTime(data.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                    Hiệu lực đến
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {data.validUntil ? formatDateTime(data.validUntil) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                    Duyệt lúc
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {data.approvedAt ? formatDateTime(data.approvedAt) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                    Nhân viên kinh doanh
                  </p>
                  <p className="text-primary font-semibold">
                    {data.sales == null
                      ? '—'
                      : typeof data.sales === 'string'
                        ? data.sales
                        : data.sales?.fullName || data.sales?.name || '—'}
                  </p>
                </div>
              </div>

              {(data.notes || data.customerNotes) ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">
                    Ghi chú
                  </h3>
                  {data.customerNotes ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {data.customerNotes}
                    </p>
                  ) : null}
                  {data.notes ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap mt-2">
                      {data.notes}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {data.counterOfferMessage ? (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-6 shadow-sm">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 text-sm">
                    Phản hồi thương lượng của bạn
                  </h3>
                  <p className="text-sm text-amber-950 dark:text-amber-50 whitespace-pre-wrap">
                    {data.counterOfferMessage}
                  </p>
                </div>
              ) : null}

              {(data.rejectReason || data.customerRejectReason) ? (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                  {data.customerRejectReason || data.rejectReason}
                </div>
              ) : null}

              {accessToken &&
              data.id != null &&
              normalizeQuotationStatus(data.status) === 'Approved' ? (
                <QuotationCounterOfferPanel
                  data={data}
                  accessToken={accessToken}
                  onSubmitted={load}
                  onAccepted={() => {
                    try {
                      sessionStorage.setItem(
                        'macvilla_b2b_orders_toast',
                        'Đã chấp nhận báo giá. Theo dõi đơn hàng tại đây khi hệ thống chuyển trạng thái.'
                      )
                    } catch {
                      /* private mode */
                    }
                    navigate('/partner/orders')
                  }}
                />
              ) : null}

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Chi tiết dòng hàng
                  </h3>
                  <span className="text-xs text-slate-500">
                    {lines.length} mục
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[720px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 w-20 sm:w-[5.5rem]">Ảnh</th>
                        <th className="px-4 sm:px-6 py-4">Sản phẩm</th>
                        <th className="px-4 sm:px-6 py-4 text-right">SL</th>
                        <th className="px-4 sm:px-6 py-4 text-right">Đơn giá</th>
                        <th className="px-4 sm:px-6 py-4 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lines.map((row) => {
                        const imgSrc = resolveStoreMediaUrl(row.imageUrl)
                        const title =
                          `${row.productName || ''}${row.variantName ? ` · ${row.variantName}` : ''}`.trim() ||
                          'Sản phẩm'
                        return (
                          <tr key={row.id}>
                            <td className="px-4 sm:px-6 py-4 align-middle">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={title}
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                                />
                              ) : (
                                <div
                                  className="w-14 h-14 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center shrink-0"
                                  title="Chưa có ảnh"
                                >
                                  <Icon
                                    name="inventory_2"
                                    className="text-xl text-slate-400 dark:text-slate-500"
                                    aria-hidden
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-4 align-middle">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {row.productName}
                                </p>
                                <p className="text-xs text-slate-500">{row.variantName}</p>
                                <p className="text-xs font-mono text-slate-400 mt-0.5">
                                  {row.currentSku}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right font-medium whitespace-nowrap">
                              {row.quantity}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                              {formatMoneyVnd(row.unitPrice)}
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right font-bold text-primary whitespace-nowrap">
                              {formatMoneyVnd(row.subTotal)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-primary text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Icon name="account_balance_wallet" className="text-[120px]" />
                </div>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                  <Icon name="analytics" className="text-xl" />
                  Tóm tắt
                </h3>
                <div className="space-y-3 relative z-10 text-sm">
                  <div className="flex justify-between text-white/90">
                    <span>Tổng tiền hàng</span>
                    <span className="font-semibold">{formatMoneyVnd(data.totalAmount)}</span>
                  </div>
                  {data.discountValue != null && Number(data.discountValue) > 0 ? (
                    <div className="flex justify-between text-white/90">
                      <span>Giảm giá</span>
                      <span className="font-semibold">
                        {data.discountType === 'Percent' ||
                        data.discountType === 'Percentage'
                          ? `${data.discountValue}%`
                          : formatMoneyVnd(data.discountValue)}
                      </span>
                    </div>
                  ) : null}
                  <div className="border-t border-white/20 pt-3 flex justify-between items-end">
                    <span className="text-white/80">Thành tiền</span>
                    <span className="text-2xl font-black">
                      {formatMoneyVnd(data.finalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/partner/quotation/history"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Icon name="arrow_back" className="text-lg" />
              Quay lại danh sách
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
