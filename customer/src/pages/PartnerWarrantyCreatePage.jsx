import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { storeB2bFetchOrderByCode } from '../api/store/storeB2bOrdersApi'
import { storeB2bCreateWarrantyClaim } from '../api/store/storeB2bWarrantyApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { warrantyOrderLineOptions } from '../lib/customerWarrantyLabels'
import { WarrantyClaimModal } from '../components/warranty/WarrantyClaimModal'
import { useAuth } from '../contexts/AuthContext'

const inputClass =
  'w-full min-w-0 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary'

export function PartnerWarrantyCreatePage() {
  const { accessToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderCodeFromUrl = searchParams.get('orderCode')?.trim() || ''

  const [orderCodeInput, setOrderCodeInput] = useState(orderCodeFromUrl)
  const [orderDetail, setOrderDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadOrderError, setLoadOrderError] = useState('')
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimModalKey, setClaimModalKey] = useState(0)

  const loadOrder = useCallback(
    async (codeOverride) => {
      const code = (codeOverride ?? orderCodeInput).trim()
      if (!code) {
        setLoadOrderError('Nhập mã đơn hàng.')
        setOrderDetail(null)
        return
      }
      if (!accessToken) {
        setLoadOrderError('Cần đăng nhập để tải đơn.')
        setOrderDetail(null)
        return
      }
      setLoadingOrder(true)
      setLoadOrderError('')
      try {
        const d = await storeB2bFetchOrderByCode(accessToken, code)
        const obj = d && typeof d === 'object' ? /** @type {Record<string, unknown>} */ (d) : null
        setOrderDetail(obj)
      } catch (err) {
        setLoadOrderError(getApiErrorMessage(err))
        setOrderDetail(null)
      } finally {
        setLoadingOrder(false)
      }
    },
    [accessToken, orderCodeInput]
  )

  const preloadedOrderCode = useRef('')
  useEffect(() => {
    if (!orderCodeFromUrl || !accessToken) return
    if (preloadedOrderCode.current === orderCodeFromUrl) return
    preloadedOrderCode.current = orderCodeFromUrl
    setOrderCodeInput(orderCodeFromUrl)
    void loadOrder(orderCodeFromUrl)
  }, [orderCodeFromUrl, accessToken, loadOrder])

  const lines = useMemo(() => {
    const raw = orderDetail?.lines
    return Array.isArray(raw) ? raw : []
  }, [orderDetail])

  const lineOptions = useMemo(() => warrantyOrderLineOptions(lines), [lines])

  const orderId = useMemo(() => {
    if (!orderDetail?.id) return null
    const n = Number(orderDetail.id)
    return Number.isFinite(n) ? n : null
  }, [orderDetail])

  return (
    <>
      <PartnerPaymentsPageHeader title="Tạo yêu cầu bảo hành" />

      <section className="p-8 pt-2 max-w-4xl">
        <div className="mb-6">
          <Link
            to="/partner/after-sales/warranty"
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
            để tạo yêu cầu.
          </div>
        ) : null}

        <WarrantyClaimModal
          key={claimModalKey}
          open={claimOpen}
          onClose={() => setClaimOpen(false)}
          accessToken={accessToken}
          mode="order"
          orderId={orderId}
          createWarrantyClaim={storeB2bCreateWarrantyClaim}
          lineOptions={lineOptions}
          onSuccess={(data) => {
            const o =
              data && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data) : null
            const ticket = o?.ticketNumber != null ? String(o.ticketNumber) : ''
            if (ticket) {
              navigate(`/partner/after-sales/warranty/${encodeURIComponent(ticket)}`, {
                replace: true,
              })
            } else {
              navigate('/partner/after-sales/warranty', { replace: true })
            }
          }}
        />

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">1. Chọn đơn hàng</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Mã đơn (orderCode)
              </label>
              <input
                type="text"
                className={inputClass}
                value={orderCodeInput}
                onChange={(e) => setOrderCodeInput(e.target.value)}
                placeholder="VD: B2B-2025-001"
              />
            </div>
            <button
              type="button"
              disabled={loadingOrder || !accessToken}
              onClick={() => void loadOrder()}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold disabled:opacity-50"
            >
              {loadingOrder ? 'Đang tải…' : 'Tải đơn'}
            </button>
          </div>
          {loadOrderError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {loadOrderError}
            </p>
          ) : null}
        </div>

        {orderDetail && orderId != null ? (
          <div className="mt-8 space-y-4">
            {lineOptions.length === 0 ? (
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                role="status"
              >
                Không có dòng hàng hợp lệ để bảo hành.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  disabled={!accessToken}
                  onClick={() => {
                    setClaimModalKey((k) => k + 1)
                    setClaimOpen(true)
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold disabled:opacity-50"
                >
                  <Icon name="build" className="text-lg" />
                  Mở form gửi yêu cầu
                </button>
                <span className="text-xs text-slate-500">
                  Mô tả lỗi và ảnh minh chứng ở bước sau.
                </span>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </>
  )
}
