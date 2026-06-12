import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import {
  storeMeFetchWarrantyTicketByNumber,
} from '../api/store/storeMeWarrantyApi'
import { storeMeFetchOrderByCode } from '../api/store/storeMeOrdersApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import {
  warrantyTicketStatusLabel,
  warrantyTicketStatusBadgeClass,
  warrantyClaimStatusLabel,
  warrantyClaimStatusBadgeClass,
  customerWarrantyTicketCanAddClaim,
  parseWarrantyTicketLines,
  warrantyLineOptionsFromTicket,
  warrantyOrderLineOptions,
} from '../lib/customerWarrantyLabels'
import { WarrantyClaimModal } from '../components/warranty/WarrantyClaimModal'
import { CustomerWarrantyLinesSection } from '../components/warranty/CustomerWarrantyLinesSection'
import { StoreLineImageThumbnail } from '../components/catalog/StoreLineImageThumbnail'

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

export function WarrantyTicketDetailPage() {
  const { ticketNumber: ticketParam } = useParams()
  const ticketNumber = ticketParam ? decodeURIComponent(ticketParam) : ''
  const navigate = useNavigate()
  const { user, accessToken } = useAuth()

  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [orderLines, setOrderLines] = useState(/** @type {unknown[] | null} */ (null))
  const [loadingOrderLines, setLoadingOrderLines] = useState(false)

  const [claimOpen, setClaimOpen] = useState(false)
  const [claimModalKey, setClaimModalKey] = useState(0)
  const [preselectedOrderItemId, setPreselectedOrderItemId] = useState(/** @type {number | null} */ (null))
  const [actionMsg, setActionMsg] = useState('')

  const loadDetail = useCallback(async () => {
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
      const d = await storeMeFetchWarrantyTicketByNumber(accessToken, ticketNumber)
      setDetail(d && typeof d === 'object' ? d : null)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken, ticketNumber])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const orderCode =
    detail?.order && typeof detail.order === 'object'
      ? /** @type {Record<string, unknown>} */ (detail.order).orderCode
      : null

  useEffect(() => {
    setOrderLines(null)
    if (!accessToken || !orderCode || String(orderCode).trim() === '') return
    let cancelled = false
    setLoadingOrderLines(true)
    void storeMeFetchOrderByCode(accessToken, String(orderCode))
      .then((ord) => {
        if (cancelled) return
        const lines = ord && typeof ord === 'object' && Array.isArray(/** @type {any} */ (ord).lines)
          ? /** @type {any} */ (ord).lines
          : []
        setOrderLines(lines)
      })
      .catch(() => {
        if (!cancelled) setOrderLines([])
      })
      .finally(() => {
        if (!cancelled) setLoadingOrderLines(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, orderCode])

  const lineOptions = useMemo(() => {
    const fromTicket = warrantyLineOptionsFromTicket(detail)
    if (fromTicket.length > 0) return fromTicket
    const claims = detail?.claims ?? detail?.Claims
    return warrantyOrderLineOptions(orderLines ?? [], parseWarrantyTicketLines(detail), claims)
  }, [orderLines, detail])

  const noEligibleLines = lineOptions.filter((o) => o.isValid !== false).length === 0

  const canAddClaim = customerWarrantyTicketCanAddClaim(detail)
  const daysRem =
    detail && typeof detail.daysRemaining === 'number' && !Number.isNaN(detail.daysRemaining)
      ? detail.daysRemaining
      : null
  const showExpiring =
    daysRem != null && daysRem >= 0 && daysRem < 30 && detail?.isValid === true

  const claims = Array.isArray(detail?.claims) ? detail.claims : []

  const ticketNumDisplay =
    detail && detail.ticketNumber != null ? String(detail.ticketNumber) : ticketNumber

  if (!user || user.customerType === 'B2B') return null
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tài khoản', href: '/account' },
    { label: 'Bảo hành của tôi', href: '/account/warranty' },
    { label: ticketNumDisplay ? `Phiếu ${ticketNumDisplay}` : 'Chi tiết', href: null },
  ]

  const st = detail && typeof detail.status === 'string' ? detail.status : ''

  return (
    <>
      <WarrantyClaimModal
        key={claimModalKey}
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        accessToken={accessToken}
        mode="ticket"
        warrantyTicketId={
          detail?.id != null && Number.isFinite(Number(detail.id)) ? Number(detail.id) : null
        }
        lineOptions={lineOptions}
        preselectedOrderItemId={preselectedOrderItemId}
        onSuccess={(data) => {
          const o =
            data && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data) : null
          const msg = typeof o?.message === 'string' ? o.message : 'Đã gửi yêu cầu bảo hành.'
          setActionMsg(msg)
          void loadDetail()
        }}
      />

      <AccountAccountShell
        hero={
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20" />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                  <Icon name="verified_user" className="text-5xl text-primary/50" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user.fullName || user.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chi tiết phiếu bảo hành</p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <>
          <Breadcrumbs items={breadcrumbItems} />

          {!accessToken ? (
            <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
              <Link to="/login" className="font-bold underline">
                Đăng nhập
              </Link>{' '}
              để xem phiếu bảo hành.
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
              <button
                type="button"
                onClick={() => void loadDetail()}
                className="font-bold text-primary shrink-0"
              >
                Thử lại
              </button>
            </div>
          ) : null}

          {actionMsg ? (
            <div
              className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
              role="status"
            >
              {actionMsg}
            </div>
          ) : null}

          {!loading && detail && !error ? (
            <>
              {showExpiring ? (
                <div
                  className="mb-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
                  role="status"
                >
                  Phiếu sắp hết hạn — còn <strong>{daysRem}</strong> ngày.
                </div>
              ) : null}

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Phiếu {ticketNumDisplay}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${warrantyTicketStatusBadgeClass(st)}`}
                    >
                      {warrantyTicketStatusLabel(st)}
                    </span>
                    {detail.isValid === true ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Còn hiệu lực
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        Không còn hiệu lực
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Phát hành: {formatDate(typeof detail.issueDate === 'string' ? detail.issueDate : undefined)}{' '}
                    · Hết hạn muộn nhất:{' '}
                    {formatDate(typeof detail.validUntil === 'string' ? detail.validUntil : undefined)}
                    {daysRem != null && detail.isValid === true ? (
                      <span> · Còn ~{daysRem} ngày</span>
                    ) : null}
                  </p>
                  {detail.order && typeof detail.order === 'object' ? (
                    <p className="text-sm mt-1">
                      Đơn hàng:{' '}
                      <Link
                        to={`/account/orders/${encodeURIComponent(
                          String(
                            /** @type {Record<string, unknown>} */ (detail.order).orderCode ?? ''
                          )
                        )}`}
                        className="font-bold text-primary hover:underline"
                      >
                        {String(/** @type {Record<string, unknown>} */ (detail.order).orderCode ?? '—')}
                      </Link>
                    </p>
                  ) : null}
                </div>
                {canAddClaim ? (
                  <button
                    type="button"
                    disabled={(loadingOrderLines && orderCode != null) || noEligibleLines}
                    onClick={() => {
                      setActionMsg('')
                      setPreselectedOrderItemId(null)
                      setClaimModalKey((k) => k + 1)
                      setClaimOpen(true)
                    }}
                    className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2 shrink-0"
                  >
                    <Icon name="build" className="text-lg" />
                    Thêm yêu cầu bảo hành
                  </button>
                ) : null}
              </div>

              <CustomerWarrantyLinesSection
                detail={detail}
                onClaimLine={
                  canAddClaim
                    ? (orderItemId) => {
                        setActionMsg('')
                        setPreselectedOrderItemId(orderItemId)
                        setClaimModalKey((k) => k + 1)
                        setClaimOpen(true)
                      }
                    : undefined
                }
              />

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50">Yêu cầu</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                        <th className="px-4 py-2 text-left">Mô tả lỗi</th>
                        <th className="px-4 py-2 text-left">Trạng thái</th>
                        <th className="px-4 py-2 text-left whitespace-nowrap">Cập nhật</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {claims.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                            Chưa có yêu cầu bảo hành nào.
                          </td>
                        </tr>
                      ) : (
                        claims.map((row, idx) => {
                          const r = /** @type {Record<string, unknown>} */ (
                            row && typeof row === 'object' ? row : {}
                          )
                          const cs = typeof r.status === 'string' ? r.status : ''
                          const title =
                            r.productName != null
                              ? String(r.productName)
                              : r.variantName != null
                                ? String(r.variantName)
                                : String(r.sku ?? '')
                          return (
                            <tr key={r.id != null ? String(r.id) : `c-${idx}`}>
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-start gap-3">
                                  <StoreLineImageThumbnail
                                    variantImageUrl={
                                      typeof r.variantImageUrl === 'string'
                                        ? r.variantImageUrl
                                        : undefined
                                    }
                                    productImageUrl={
                                      typeof r.imageUrl === 'string' ? r.imageUrl : undefined
                                    }
                                    alt={title}
                                  />
                                  <div className="min-w-0">
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                      {title}
                                    </span>
                                    {r.sku != null ? (
                                      <span className="block text-xs font-mono text-slate-500">
                                        {String(r.sku)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-slate-600 dark:text-slate-300 max-w-[280px]">
                                {r.defectDescription != null ? String(r.defectDescription) : '—'}
                                {r.resolution != null && String(r.resolution).trim() !== '' ? (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Kết luận: {String(r.resolution)}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 align-top whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${warrantyClaimStatusBadgeClass(cs)}`}
                                >
                                  {warrantyClaimStatusLabel(cs)}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-top text-xs text-slate-500 whitespace-nowrap">
                                <div>Tạo: {formatDateTime(typeof r.createdAt === 'string' ? r.createdAt : undefined)}</div>
                                {r.resolvedDate != null ? (
                                  <div className="mt-1">
                                    Xử lý: {formatDateTime(String(r.resolvedDate))}
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/account/warranty')}
                className="mt-6 text-sm font-bold text-primary hover:underline"
              >
                ← Danh sách phiếu bảo hành
              </button>
            </>
          ) : null}
        </>
      </AccountAccountShell>
    </>
  )
}
