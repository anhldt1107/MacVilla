import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import {
  storeB2bCancelReturnExchangeRequest,
  storeB2bFetchReturnExchangeByTicket,
} from '../api/store/storeB2bReturnExchangeApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  returnExchangeStatusLabel,
  returnExchangeStatusBadgeClass,
  returnExchangeTypeLabel,
  returnExchangeTypeBadgeClass,
  returnExchangeAllowsCustomerCancel,
} from '../lib/returnExchangeStatus'
import { ReturnExchangeStatusStepper } from '../components/returns/ReturnExchangeStatusStepper'
import { ReturnItemsTable } from '../components/returns/ReturnItemsTable'
import { useAuth } from '../contexts/AuthContext'

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

export function PartnerReturnExchangeDetailPage() {
  const { ticketNumber: ticketParam } = useParams()
  const ticketNumber = ticketParam ? decodeURIComponent(ticketParam) : ''
  const { accessToken, isAuthenticated } = useAuth()

  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelBusy, setCancelBusy] = useState(false)

  const load = useCallback(async () => {
    if (!ticketNumber?.trim()) {
      setError('Thiếu mã phiếu trên URL.')
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
      const d = await storeB2bFetchReturnExchangeByTicket(accessToken, ticketNumber)
      setDetail(d && typeof d === 'object' ? /** @type {Record<string, unknown>} */ (d) : null)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken, ticketNumber])

  useEffect(() => {
    void load()
  }, [load])

  const status = typeof detail?.status === 'string' ? detail.status : ''
  const type = typeof detail?.type === 'string' ? detail.type : ''

  const orderCode = useMemo(() => {
    if (!detail) return ''
    if (detail.orderCode != null) return String(detail.orderCode)
    const o = detail.order
    if (o && typeof o === 'object' && /** @type {Record<string, unknown>} */ (o).orderCode != null) {
      return String(/** @type {Record<string, unknown>} */ (o).orderCode)
    }
    return ''
  }, [detail])

  const items = useMemo(() => {
    const raw = detail?.items
    return Array.isArray(raw) ? raw : []
  }, [detail])

  const canCancel = returnExchangeAllowsCustomerCancel(status)

  const handleCancel = async () => {
    if (!accessToken || !ticketNumber || cancelBusy) return
    if (!window.confirm('Hủy yêu cầu đổi/trả này?')) return
    setCancelBusy(true)
    setError('')
    try {
      const updated = await storeB2bCancelReturnExchangeRequest(accessToken, ticketNumber)
      setDetail(updated && typeof updated === 'object' ? /** @type {Record<string, unknown>} */ (updated) : detail)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setCancelBusy(false)
    }
  }

  return (
    <>
      <PartnerPaymentsPageHeader title="Chi tiết phiếu đổi / trả" />

      <section className="p-8 pt-2 max-w-4xl">
        <div className="mb-6">
          <Link
            to="/partner/after-sales/returns"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <Icon name="arrow_back" className="text-lg" />
            Danh sách phiếu
          </Link>
        </div>

        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập doanh nghiệp
            </Link>{' '}
            để xem chi tiết.
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 flex flex-wrap justify-between gap-2 mb-6"
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

        {loading ? <p className="text-slate-500 text-sm">Đang tải…</p> : null}

        {!loading && detail && !error ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-3 items-start">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Mã phiếu</p>
                  <p className="text-xl font-mono font-bold text-primary">{ticketNumber}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${returnExchangeTypeBadgeClass(type)}`}
                  >
                    {returnExchangeTypeLabel(type)}
                  </span>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${returnExchangeStatusBadgeClass(status)}`}
                  >
                    {returnExchangeStatusLabel(status)}
                  </span>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4 text-sm">
                <ReturnExchangeStatusStepper status={status} />
                {canCancel ? (
                  <button
                    type="button"
                    disabled={cancelBusy || !accessToken}
                    onClick={() => void handleCancel()}
                    className="px-4 py-2 rounded-lg border border-rose-300 text-rose-800 dark:border-rose-800 dark:text-rose-200 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                  >
                    {cancelBusy ? 'Đang hủy…' : 'Hủy yêu cầu'}
                  </button>
                ) : null}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Tạo lúc</p>
                    <p className="text-slate-900 dark:text-slate-100">
                      {formatDateTime(typeof detail.createdAt === 'string' ? detail.createdAt : undefined)}
                    </p>
                  </div>
                  {detail.updatedAt != null ? (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Cập nhật</p>
                      <p className="text-slate-900 dark:text-slate-100">
                        {formatDateTime(
                          typeof detail.updatedAt === 'string' ? detail.updatedAt : undefined
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>

                {orderCode ? (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Đơn hàng</p>
                    <Link
                      to={`/partner/orders/${encodeURIComponent(orderCode)}`}
                      className="text-primary font-bold hover:underline font-mono"
                    >
                      {orderCode}
                    </Link>
                  </div>
                ) : null}

                {detail.reason != null ? (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Lý do</p>
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {String(detail.reason)}
                    </p>
                  </div>
                ) : null}

                {detail.customerNote != null && String(detail.customerNote).trim() !== '' ? (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú khách</p>
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {String(detail.customerNote)}
                    </p>
                  </div>
                ) : null}

                {detail.message != null && String(detail.message).trim() !== '' ? (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-slate-700 dark:text-slate-300">
                    <span className="text-xs font-bold uppercase text-slate-500">Thông báo · </span>
                    {String(detail.message)}
                  </div>
                ) : null}
              </div>
            </div>

            {items.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                  Dòng hàng
                </div>
                <ReturnItemsTable items={items} />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  )
}
