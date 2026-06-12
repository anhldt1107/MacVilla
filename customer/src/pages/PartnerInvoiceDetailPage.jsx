import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import {
  storeB2bFetchInvoiceByNumber,
  storeB2bFetchInvoicePdfUrl,
} from '../api/store/storeB2bDebtInvoicesApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  invoiceStatusLabel,
  invoiceStatusBadgeClass,
  invoiceDaysUntilDueClass,
} from '../lib/invoiceStatus'
import { useAuth } from '../contexts/AuthContext'

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDaysLabel(days) {
  if (days == null || Number.isNaN(Number(days))) return '—'
  const n = Math.floor(Number(days))
  if (n < 0) return `${n} ngày (quá hạn)`
  if (n === 0) return 'Đến hạn hôm nay'
  return `Còn ${n} ngày`
}

/** @param {Record<string, unknown>} d */
function pickOrderCode(d) {
  if (d.orderCode != null) return String(d.orderCode)
  const o = d.order
  if (o && typeof o === 'object' && /** @type {Record<string, unknown>} */ (o).orderCode != null) {
    return String(/** @type {Record<string, unknown>} */ (o).orderCode)
  }
  return ''
}

/** @param {Record<string, unknown>} d */
function pickContractNumber(d) {
  if (d.contractNumber != null) return String(d.contractNumber)
  const c = d.contract
  if (c && typeof c === 'object' && /** @type {Record<string, unknown>} */ (c).contractNumber != null) {
    return String(/** @type {Record<string, unknown>} */ (c).contractNumber)
  }
  return ''
}

/** @param {Record<string, unknown>} d */
function pickQuotationRoute(d) {
  const o = d.order
  if (o && typeof o === 'object') {
    const ord = /** @type {Record<string, unknown>} */ (o)
    if (ord.quoteId != null) return `/partner/quotation/${encodeURIComponent(String(ord.quoteId))}`
    if (ord.quotationId != null) {
      return `/partner/quotation/${encodeURIComponent(String(ord.quotationId))}`
    }
  }
  if (d.quoteId != null) return `/partner/quotation/${encodeURIComponent(String(d.quoteId))}`
  if (d.quotationId != null) return `/partner/quotation/${encodeURIComponent(String(d.quotationId))}`
  return ''
}

export function PartnerInvoiceDetailPage() {
  const { invoiceNumber: invoiceNumberParam } = useParams()
  const invoiceNumber = invoiceNumberParam ? decodeURIComponent(invoiceNumberParam) : ''
  const { accessToken, isAuthenticated } = useAuth()

  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState('')

  const load = useCallback(async () => {
    if (!invoiceNumber?.trim()) {
      setError('Thiếu số hóa đơn trên URL.')
      setDetail(null)
      setLoading(false)
      return
    }
    if (!accessToken) {
      setDetail(null)
      setLoading(false)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await storeB2bFetchInvoiceByNumber(accessToken, invoiceNumber)
      setDetail(data && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data) : null)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken, invoiceNumber])

  useEffect(() => {
    void load()
  }, [load])

  const status = detail?.status
  const daysRaw = detail?.daysUntilDue
  const days = typeof daysRaw === 'number' ? daysRaw : Number(daysRaw)
  const orderCode = detail ? pickOrderCode(detail) : ''
  const contractNumber = detail ? pickContractNumber(detail) : ''
  const quotationPath = detail ? pickQuotationRoute(detail) : ''
  const pdfUrlDirect =
    detail?.pdfUrl != null && String(detail.pdfUrl).trim() !== '' ? String(detail.pdfUrl) : ''

  const remainingAmt = Number(detail?.remainingAmount ?? NaN)
  const canPay = Number.isFinite(remainingAmt) && remainingAmt > 0

  const paySearch = new URLSearchParams()
  if (invoiceNumber) paySearch.set('invoiceNumber', invoiceNumber)
  if (detail?.id != null) paySearch.set('invoiceId', String(detail.id))
  const payHref = `/partner/payments/pay?${paySearch.toString()}`

  const handleOpenPdf = async () => {
    if (pdfUrlDirect) {
      window.open(pdfUrlDirect, '_blank', 'noopener,noreferrer')
      return
    }
    if (!accessToken || !invoiceNumber) return
    setPdfBusy(true)
    setPdfError('')
    try {
      const data = await storeB2bFetchInvoicePdfUrl(accessToken, invoiceNumber)
      const url =
        data && typeof data === 'object' && 'pdfUrl' in data
          ? String(/** @type {Record<string, unknown>} */ (data).pdfUrl ?? '')
          : ''
      if (!url?.trim()) {
        setPdfError('Không nhận được liên kết PDF.')
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setPdfError(getApiErrorMessage(err))
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <>
      <PartnerPaymentsPageHeader title="Chi tiết hóa đơn" paymentsNav />

      <section className="p-8 pt-6 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            to="/partner/payments/invoices"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <Icon name="arrow_back" className="text-lg" />
            Danh sách hóa đơn
          </Link>
        </div>

        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem chi tiết.
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap justify-between gap-2"
            role="alert"
          >
            {error}
            <button
              type="button"
              onClick={() => void load()}
              className="font-bold text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500 mt-6">Đang tải…</p>
        ) : null}

        {!loading && detail && !error ? (
          <div className="mt-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-3 items-start">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Số hóa đơn</p>
                  <p className="text-xl font-mono font-bold text-primary">{invoiceNumber}</p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${invoiceStatusBadgeClass(
                    typeof status === 'string' ? status : undefined
                  )}`}
                >
                  {invoiceStatusLabel(typeof status === 'string' ? status : undefined)}
                </span>
              </div>

              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Ngày phát hành</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(
                      typeof detail.issueDate === 'string' ? detail.issueDate : undefined
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Hạn thanh toán</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(typeof detail.dueDate === 'string' ? detail.dueDate : undefined)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 font-semibold">Hạn nộp (theo ngày)</p>
                  <p
                    className={`font-semibold ${invoiceDaysUntilDueClass(
                      Number.isNaN(days) ? null : days
                    )}`}
                  >
                    {formatDaysLabel(Number.isNaN(days) ? null : days)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Tổng tiền</p>
                  <p className="font-medium">{formatMoneyVnd(detail.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Đã thanh toán</p>
                  <p className="font-medium">{formatMoneyVnd(detail.paidAmount)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 font-semibold">Còn lại</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatMoneyVnd(detail.remainingAmount)}
                  </p>
                </div>
                {detail.taxCode != null || detail.companyName != null ? (
                  <>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Mã số thuế</p>
                      <p className="font-medium">{detail.taxCode != null ? String(detail.taxCode) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Tên công ty (HĐ)</p>
                      <p className="font-medium">
                        {detail.companyName != null ? String(detail.companyName) : '—'}
                      </p>
                    </div>
                  </>
                ) : null}
                {detail.billingAddress != null ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500 font-semibold">Địa chỉ xuất HĐ</p>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {typeof detail.billingAddress === 'string'
                        ? detail.billingAddress
                        : JSON.stringify(detail.billingAddress)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pdfBusy || (!pdfUrlDirect && !accessToken)}
                  onClick={() => void handleOpenPdf()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-95 disabled:opacity-50"
                >
                  <Icon name="picture_as_pdf" className="text-lg" />
                  {pdfBusy ? 'Đang lấy link…' : 'Tải PDF'}
                </button>
                {canPay ? (
                  <Link
                    to={payHref}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-bold hover:bg-primary/5"
                  >
                    <Icon name="payments" className="text-lg" />
                    Thanh toán
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400">
                    Không còn số phải trả
                  </span>
                )}
              </div>
              {pdfError ? (
                <p className="px-6 pb-4 text-sm text-red-600 dark:text-red-400" role="alert">
                  {pdfError}
                </p>
              ) : null}
            </div>

            {(orderCode || contractNumber || quotationPath) && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Liên kết</h3>
                <ul className="space-y-2 text-sm">
                  {orderCode ? (
                    <li>
                      <Link
                        to={`/partner/orders/${encodeURIComponent(orderCode)}`}
                        className="text-primary font-semibold hover:underline"
                      >
                        Đơn hàng {orderCode}
                      </Link>
                    </li>
                  ) : null}
                  {contractNumber ? (
                    <li>
                      <Link
                        to={`/partner/contracts/${encodeURIComponent(contractNumber)}`}
                        className="text-primary font-semibold hover:underline"
                      >
                        Hợp đồng {contractNumber}
                      </Link>
                    </li>
                  ) : null}
                  {quotationPath ? (
                    <li>
                      <Link to={quotationPath} className="text-primary font-semibold hover:underline">
                        Báo giá liên quan
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </div>
            )}

            {Array.isArray(detail.payments) && detail.payments.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                  Lịch sử thanh toán (theo HĐ)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[480px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                        <th className="px-4 py-2">Ngày</th>
                        <th className="px-4 py-2">Số tiền</th>
                        <th className="px-4 py-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {detail.payments.map((p, i) => {
                        const row = p && typeof p === 'object' ? /** @type {Record<string, unknown>} */ (p) : {}
                        const amt = row.amount ?? row.paidAmount ?? row.value
                        const dt = row.paidAt ?? row.paymentDate ?? row.createdAt ?? row.date
                        const note = row.note ?? row.description ?? row.reference
                        return (
                          <tr key={row.id != null ? String(row.id) : `p-${i}`}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {formatDate(typeof dt === 'string' ? dt : undefined)}
                            </td>
                            <td className="px-4 py-2 font-medium">{formatMoneyVnd(amt)}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                              {note != null ? String(note) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  )
}
