import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import {
  storeB2bFetchWarrantyTicketByNumber,
  storeB2bCreateWarrantyClaim,
} from '../api/store/storeB2bWarrantyApi'
import { storeB2bFetchOrderByCode } from '../api/store/storeB2bOrdersApi'
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
import { resolveStoreMediaUrl } from '../lib/catalog/resolveStoreMediaUrl'
import { useAuth } from '../contexts/AuthContext'

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

/** @param {unknown} raw */
function splitEvidenceUrls(raw) {
  if (raw == null || String(raw).trim() === '') return []
  return String(raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function PartnerWarrantyDetailPage() {
  const { ticketNumber: ticketParam } = useParams()
  const ticketNumber = ticketParam ? decodeURIComponent(ticketParam) : ''
  const { accessToken, isAuthenticated } = useAuth()

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
      const d = await storeB2bFetchWarrantyTicketByNumber(accessToken, ticketNumber)
      setDetail(d && typeof d === 'object' ? /** @type {Record<string, unknown>} */ (d) : null)
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

  const contract =
    detail?.contract && typeof detail.contract === 'object'
      ? /** @type {Record<string, unknown>} */ (detail.contract)
      : null
  const contractNumber = contract?.contractNumber != null ? String(contract.contractNumber) : ''

  useEffect(() => {
    setOrderLines(null)
    if (!accessToken || !orderCode || String(orderCode).trim() === '') return
    let cancelled = false
    setLoadingOrderLines(true)
    void storeB2bFetchOrderByCode(accessToken, String(orderCode))
      .then((ord) => {
        if (cancelled) return
        const lines =
          ord && typeof ord === 'object' && Array.isArray(/** @type {Record<string, unknown>} */ (ord).lines)
            ? /** @type {Record<string, unknown>} */ (ord).lines
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

  const st = detail && typeof detail.status === 'string' ? detail.status : ''

  const noEligibleLines = lineOptions.filter((o) => o.isValid !== false).length === 0

  return (
    <>
      <WarrantyClaimModal
        key={claimModalKey}
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        accessToken={accessToken}
        mode="ticket"
        createWarrantyClaim={storeB2bCreateWarrantyClaim}
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

      <PartnerPaymentsPageHeader title="Chi tiết phiếu bảo hành" />

      <section className="p-8 pt-2 max-w-5xl">
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
            để xem phiếu.
          </div>
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
                      to={`/partner/orders/${encodeURIComponent(
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
                {contractNumber ? (
                  <p className="text-sm mt-1">
                    Hợp đồng:{' '}
                    <Link
                      to={`/partner/contracts/${encodeURIComponent(contractNumber)}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {contractNumber}
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
                  title={
                    noEligibleLines
                      ? 'Không có sản phẩm còn hạn bảo hành.'
                      : undefined
                  }
                  className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2 shrink-0"
                >
                  <Icon name="build" className="text-lg" />
                  Thêm yêu cầu bảo hành
                </button>
              ) : null}
            </div>

            {canAddClaim && noEligibleLines ? (
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                Không có sản phẩm còn hạn bảo hành trên phiếu này.
              </p>
            ) : null}

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
                        const evidences = splitEvidenceUrls(r.imagesUrl)
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
                              {evidences.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {evidences.map((url, i) => (
                                    <a
                                      key={`${url}-${i}`}
                                      href={resolveStoreMediaUrl(url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block"
                                    >
                                      <img
                                        src={resolveStoreMediaUrl(url)}
                                        alt=""
                                        className="h-12 w-12 rounded border border-slate-200 dark:border-slate-600 object-cover"
                                      />
                                    </a>
                                  ))}
                                </div>
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
                              <div>
                                Tạo:{' '}
                                {formatDateTime(typeof r.createdAt === 'string' ? r.createdAt : undefined)}
                              </div>
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
          </>
        ) : null}
      </section>
    </>
  )
}
