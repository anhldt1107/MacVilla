import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { storeMeFetchPaymentById } from '../api/store/storeMePaymentsApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  paymentTransactionTypeLabel,
  paymentTransactionFlowIcon,
  paymentTransactionIsIncoming,
  paymentTransactionTypeBadgeClass,
} from '../lib/customerPaymentTransactionLabels'
import {
  invoiceStatusLabel,
  invoiceStatusBadgeClass,
} from '../lib/invoiceStatus'

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Math.abs(Number(value))) + 'đ'
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

export function AccountPaymentDetailPage() {
  const { id: idParam } = useParams()
  const id = idParam ? decodeURIComponent(idParam) : ''
  const navigate = useNavigate()
  const { user, accessToken } = useAuth()

  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id?.trim()) {
      setError('Thiếu mã giao dịch trên URL.')
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
      const d = await storeMeFetchPaymentById(accessToken, id)
      setDetail(d && typeof d === 'object' ? d : null)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken, id])

  useEffect(() => {
    void load()
  }, [load])

  if (!user || user.customerType === 'B2B') return null
  const tx = detail && typeof detail.transactionType === 'string' ? detail.transactionType : ''
  const incoming = paymentTransactionIsIncoming(tx)
  const amtClass = incoming
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-rose-700 dark:text-rose-400'
  const sign = incoming ? '+' : '−'

  const inv =
    detail?.invoice && typeof detail.invoice === 'object'
      ? /** @type {Record<string, unknown>} */ (detail.invoice)
      : null
  const invNum = inv?.invoiceNumber != null ? String(inv.invoiceNumber) : ''

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tài khoản', href: '/account' },
    { label: 'Lịch sử thanh toán', href: '/account/payments' },
    { label: id ? `Giao dịch #${id}` : 'Chi tiết', href: null },
  ]

  return (
    <div className="max-w-[1280px] mx-auto w-full">
      <Breadcrumbs items={breadcrumbItems} />

      {!accessToken ? (
        <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
          <Link to="/login" className="font-bold underline">
            Đăng nhập
          </Link>{' '}
          để xem chi tiết giao dịch.
        </p>
      ) : null}

      {loading ? (
        <p className="text-slate-500 py-8 text-center">Đang tải…</p>
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

      {!loading && detail && !error ? (
        <>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-slate-900 dark:text-slate-50 text-2xl font-black tracking-tight flex items-center gap-2">
                <Icon
                  name={paymentTransactionFlowIcon(tx)}
                  className={`text-3xl ${incoming ? 'text-emerald-600' : 'text-rose-600'}`}
                />
                Chi tiết giao dịch
              </h1>
              <p className="text-slate-500 mt-1 text-sm">Mã #{String(detail.id ?? id)}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${paymentTransactionTypeBadgeClass(tx)}`}
                >
                  {paymentTransactionTypeLabel(tx)}
                </span>
              </div>
            </div>
            <p className={`text-2xl font-black tabular-nums ${amtClass}`}>
              {sign} {formatMoney(detail.amount)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3 text-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Thông tin giao dịch</h3>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Thời gian</span>
                <span className="font-medium text-right">
                  {formatDateTime(typeof detail.paymentDate === 'string' ? detail.paymentDate : undefined)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Phương thức</span>
                <span className="font-medium text-right">
                  {detail.paymentMethod != null ? String(detail.paymentMethod) : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Tham chiếu</span>
                <span className="font-mono text-right break-all">
                  {detail.referenceCode != null ? String(detail.referenceCode) : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4 items-start">
                <span className="text-slate-500 shrink-0">Ghi chú</span>
                <span className="text-right text-slate-700 dark:text-slate-300">
                  {detail.note != null && String(detail.note).trim() !== '' ? String(detail.note) : '—'}
                </span>
              </div>
            </div>

            {inv ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Hóa đơn liên quan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số HĐ</span>
                    <Link
                      to={`/account/invoices/${encodeURIComponent(invNum)}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {invNum || '—'}
                    </Link>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Trạng thái</span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${invoiceStatusBadgeClass(
                        typeof inv.status === 'string' ? inv.status : ''
                      )}`}
                    >
                      {invoiceStatusLabel(typeof inv.status === 'string' ? inv.status : '')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tổng tiền</span>
                    <span>{formatMoney(inv.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đến hạn</span>
                    <span>{formatDate(typeof inv.dueDate === 'string' ? inv.dueDate : undefined)}</span>
                  </div>
                </div>
                <Link
                  to={`/account/invoices/${encodeURIComponent(invNum)}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  Xem hóa đơn đầy đủ
                  <Icon name="chevron_right" className="text-lg" />
                </Link>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-500">
                Giao dịch không gắn hóa đơn.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/account/payments')}
            className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <Icon name="arrow_back" className="text-lg" />
            Về lịch sử thanh toán
          </button>
        </>
      ) : null}
    </div>
  )
}
