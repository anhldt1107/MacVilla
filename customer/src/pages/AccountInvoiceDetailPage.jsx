import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import {
  storeMeFetchInvoiceByNumber,
  storeMeFetchInvoicePdfUrl,
} from '../api/store/storeMeInvoicesApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  invoiceStatusLabel,
  invoiceStatusBadgeClass,
  invoiceDaysUntilDueClass,
} from '../lib/invoiceStatus'

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

export function AccountInvoiceDetailPage() {
  const { invoiceNumber: invoiceNumberParam } = useParams()
  const invoiceNumber = invoiceNumberParam ? decodeURIComponent(invoiceNumberParam) : ''
  const { user, accessToken } = useAuth()

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
      const data = await storeMeFetchInvoiceByNumber(accessToken, invoiceNumber)
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

  const pdfUrlDirect =
    detail?.pdfUrl != null && String(detail.pdfUrl).trim() !== '' ? String(detail.pdfUrl) : ''

  const handleOpenPdf = async () => {
    if (pdfUrlDirect) {
      window.open(pdfUrlDirect, '_blank', 'noopener,noreferrer')
      return
    }
    if (!accessToken || !invoiceNumber) return
    setPdfBusy(true)
    setPdfError('')
    try {
      const data = await storeMeFetchInvoicePdfUrl(accessToken, invoiceNumber)
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

  if (!user || user.customerType === 'B2B') return null
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tài khoản', href: '/account' },
    { label: 'Lịch sử thanh toán', href: '/account/payments' },
    { label: invoiceNumber ? `HĐ ${invoiceNumber}` : 'Hóa đơn', href: null },
  ]

  return (
    <div className="max-w-[960px] mx-auto w-full">
      <Breadcrumbs items={breadcrumbItems} />

      {!accessToken ? (
        <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
          <Link to="/login" className="font-bold underline">
            Đăng nhập
          </Link>{' '}
          để xem hóa đơn.
        </p>
      ) : null}

      {error && !loading ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 mb-6 flex justify-between gap-2"
          role="alert"
        >
          {error}
          <button type="button" onClick={() => void load()} className="font-bold text-primary shrink-0">
            Thử lại
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-slate-500 py-8 text-center">Đang tải…</p>
      ) : null}

      {!loading && detail && !error ? (
        <div className="space-y-6">
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
                  {formatDate(typeof detail.issueDate === 'string' ? detail.issueDate : undefined)}
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

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={pdfBusy || (!pdfUrlDirect && !accessToken)}
                onClick={() => void handleOpenPdf()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-95 disabled:opacity-50"
              >
                <Icon name="picture_as_pdf" className="text-lg" />
                {pdfBusy ? 'Đang lấy link…' : 'Tải PDF'}
              </button>
              {pdfError ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {pdfError}
                </p>
              ) : null}
            </div>
          </div>

          {orderCode ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Liên kết</h3>
              <Link
                to={`/account/orders/${encodeURIComponent(orderCode)}`}
                className="text-primary font-semibold hover:underline"
              >
                Đơn hàng {orderCode}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <Link
        to="/account/payments"
        className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
      >
        <Icon name="arrow_back" className="text-lg" />
        Về lịch sử thanh toán
      </Link>
    </div>
  )
}
