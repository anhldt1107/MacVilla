import { useState, useCallback, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import {
  storeB2bFetchContractByNumber,
  storeB2bConfirmContract,
} from '../api/store/storeB2bContractsApi'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../lib/auth/mapValidationErrors'
import {
  contractStatusLabel,
  contractStatusBadgeClass,
  contractAllowsCustomerConfirm,
} from '../lib/contractStatus'
import { useAuth } from '../contexts/AuthContext'
import { resolveStoreMediaUrl } from '../lib/catalog/resolveStoreMediaUrl'

const inputClass =
  'w-full min-w-0 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary'

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

/** @param {Record<string, unknown>} line — dòng báo giá trong hợp đồng */
function contractQuoteLineSpecs(line) {
  const parts = []
  const dRaw = line.dimensions
  const d = typeof dRaw === 'string' ? dRaw.trim() : ''
  if (d) parts.push(`Kích thước: ${d}`)
  const w = line.weight
  if (w != null && !Number.isNaN(Number(w))) {
    const num = Number(w)
    parts.push(`${num === Math.floor(num) ? String(Math.round(num)) : num.toLocaleString('vi-VN')} kg`)
  }
  const wm = Number(line.warrantyPeriodMonths ?? 0)
  if (wm > 0) parts.push(`Bảo hành ${wm} tháng`)
  return parts.length ? parts.join(' · ') : ''
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

/** @param {Record<string, unknown>} data */
function pickQuoteCode(data) {
  if (data.quoteCode) return String(data.quoteCode)
  const q = data.quote
  if (q && typeof q === 'object' && q.quoteCode) return String(q.quoteCode)
  return ''
}

/**
 * Hai bước: (1) xem lại (2) ghi chú tùy chọn rồi xác nhận.
 */
function ContractConfirmModal({ open, onClose, contractLabel, onConfirm, busy }) {
  const [step, setStep] = useState(1)
  const [notes, setNotes] = useState('')
  const [localError, setLocalError] = useState('')

  if (!open) return null

  const handleFinal = async () => {
    setLocalError('')
    try {
      await onConfirm(notes.trim())
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        const fe = mapValidationErrorsToFirstMessage(err.errors)
        setLocalError(Object.values(fe)[0] || getApiErrorMessage(err))
      } else {
        setLocalError(getApiErrorMessage(err))
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Đóng"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[1] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {step === 1 ? 'Xác nhận hợp đồng' : 'Hoàn tất xác nhận'}
        </h3>
        {step === 1 ? (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Bạn sắp xác nhận hợp đồng <strong className="text-primary">{contractLabel}</strong>.
              Vui lòng đảm bảo đã đọc điều khoản và tài liệu đính kèm (nếu có). Bước tiếp theo cho phép
              thêm ghi chú tùy chọn trước khi gửi.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
              >
                Tiếp tục
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-2">Ghi chú (tùy chọn)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Xác nhận theo email pháp chế…"
              className={`${inputClass} resize-y min-h-[80px] mb-4`}
              maxLength={2000}
            />
            {localError ? (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3" role="alert">
                {localError}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleFinal()}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold"
              >
                {busy ? 'Đang gửi…' : 'Xác nhận'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function PartnerContractDetailPage() {
  const { contractNumber: contractNumberParam } = useParams()
  const contractNumber = contractNumberParam
    ? decodeURIComponent(contractNumberParam)
    : ''
  const { accessToken, isAuthenticated } = useAuth()

  const [data, setData] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmSeq, setConfirmSeq] = useState(0)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const load = useCallback(async () => {
    if (!contractNumber?.trim()) {
      setError('Thiếu mã hợp đồng trên URL.')
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
      const d = await storeB2bFetchContractByNumber(accessToken, contractNumber)
      setData(d && typeof d === 'object' ? d : null)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [accessToken, contractNumber])

  useEffect(() => {
    void load()
  }, [load])

  const quoteCode = data ? pickQuoteCode(data) : ''
  const attachmentRaw =
    data && typeof data.attachmentUrl === 'string' ? data.attachmentUrl.trim() : ''
  const attachmentUrl = attachmentRaw ? resolveStoreMediaUrl(attachmentRaw) : ''
  const rawId = data?.id
  const id = typeof rawId === 'number' ? rawId : Number(rawId)
  const canConfirmAction =
    Boolean(data) &&
    contractAllowsCustomerConfirm(
      typeof data.status === 'string' ? data.status : ''
    ) &&
    Number.isFinite(id)

  const handleConfirmApi = async (notes) => {
    if (!accessToken || !Number.isFinite(id)) {
      throw new Error('Thiếu thông tin hợp đồng.')
    }
    setConfirmBusy(true)
    try {
      await storeB2bConfirmContract(
        accessToken,
        id,
        notes ? { notes } : {}
      )
      await load()
    } finally {
      setConfirmBusy(false)
    }
  }

  const orders = Array.isArray(data?.orders) ? data.orders : []
  const quote = data?.quote && typeof data.quote === 'object' ? data.quote : null
  const quoteItems = Array.isArray(quote?.items) ? quote.items : []

  const contractDisplayAmountRaw =
    data?.totalAmount != null
      ? data.totalAmount
      : quote?.finalAmount != null
        ? quote.finalAmount
        : quote?.totalAmount
  const contractDisplayAmount =
    contractDisplayAmountRaw != null && !Number.isNaN(Number(contractDisplayAmountRaw))
      ? Number(contractDisplayAmountRaw)
      : null

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
          <Link to="/partner/contracts" className="hover:text-primary">
            Hợp đồng
          </Link>
          <Icon name="chevron_right" className="text-sm" />
          <span className="text-slate-900 dark:text-white font-medium truncate">
            {contractNumber || '—'}
          </span>
        </nav>

        {!isAuthenticated || !accessToken ? (
          <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
            <Link to="/login" className="font-bold underline">
              Đăng nhập
            </Link>{' '}
            để xem chi tiết.
          </p>
        ) : null}

        {loading ? (
          <p className="text-slate-500 py-12 text-center">Đang tải…</p>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 mb-6 flex flex-wrap justify-between gap-2"
            role="alert"
          >
            {error}
            {accessToken ? (
              <button
                type="button"
                onClick={() => void load()}
                className="font-bold text-primary hover:underline"
              >
                Thử lại
              </button>
            ) : null}
          </div>
        ) : null}

        {!loading && data ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {String(data.contractNumber ?? contractNumber)}
                  </h1>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${contractStatusBadgeClass(
                      typeof data.status === 'string' ? data.status : ''
                    )}`}
                  >
                    {contractStatusLabel(
                      typeof data.status === 'string' ? data.status : ''
                    )}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  ID #{data.id} · Tạo {formatDateTime(data.createdAt)}
                </p>
              </div>
              {canConfirmAction ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmSeq((s) => s + 1)
                    setConfirmOpen(true)
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                >
                  <Icon name="verified" className="text-lg" />
                  Xác nhận hợp đồng
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Liên kết báo giá
                </h3>
                {quoteCode ? (
                  <Link
                    to={`/partner/quotation/${encodeURIComponent(quoteCode)}`}
                    className="text-primary font-bold hover:underline"
                  >
                    {quoteCode}
                  </Link>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Khách xác nhận lúc
                </h3>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {data.customerConfirmedAt
                    ? formatDateTime(data.customerConfirmedAt)
                    : '—'}
                </p>
              </div>
            </div>

            {attachmentUrl ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Icon name="picture_as_pdf" className="text-2xl text-red-600" />
                  <span className="text-sm font-medium">Tài liệu đính kèm</span>
                </div>
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90"
                >
                  <Icon name="open_in_new" className="text-lg" />
                  Mở / tải PDF
                </a>
              </div>
            ) : null}

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Hiệu lực</p>
                <p className="font-medium">
                  {data.validFrom || data.validTo
                    ? `${formatDateTime(data.validFrom)} → ${formatDateTime(data.validTo)}`
                    : 'Chưa đặt thời hạn'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Ngày ký</p>
                <p className="font-medium">
                  {data.signedDate ? formatDateTime(data.signedDate) : '—'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Giá trị (theo báo giá)</p>
                <p className="font-semibold text-primary text-lg">
                  {contractDisplayAmount != null ? formatMoneyVnd(contractDisplayAmount) : '—'}
                </p>
              </div>
              {data.paymentTerms ? (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Điều khoản thanh toán
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {String(data.paymentTerms)}
                  </p>
                </div>
              ) : null}
              {data.notes ? (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Ghi chú</p>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {String(data.notes)}
                  </p>
                </div>
              ) : null}
            </div>

            {quote &&
            (quote.totalAmount != null ||
              quote.finalAmount != null ||
              quote.discountValue != null) ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-5 text-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Giá trị chi tiết từ báo giá
                </h3>
                <div className="space-y-2 max-w-md">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600 dark:text-slate-400">Tổng tiền hàng</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatMoneyVnd(quote.totalAmount)}
                    </span>
                  </div>
                  {quote.discountValue != null && Number(quote.discountValue) > 0 ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-600 dark:text-slate-400">Giảm giá</span>
                      <span className="font-semibold">
                        {quote.discountType === 'Percent' || quote.discountType === 'Percentage'
                          ? `${quote.discountValue}%`
                          : formatMoneyVnd(quote.discountValue)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Thành tiền</span>
                    <span className="font-bold text-primary">
                      {formatMoneyVnd(quote.finalAmount ?? quote.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {quoteItems.length > 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Theo báo giá {quote?.quoteCode ? `(${String(quote.quoteCode)})` : ''}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left w-20">Ảnh</th>
                        <th className="px-4 py-3 text-left">Mặt hàng</th>
                        <th className="px-4 py-3 text-right">SL</th>
                        <th className="px-4 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {quoteItems.map((rawLine, idx) => {
                        const line =
                          typeof rawLine === 'object' && rawLine !== null ? rawLine : {}
                        const lid = typeof line.id === 'number' ? line.id : idx
                        const imgSrc =
                          typeof line.imageUrl === 'string'
                            ? resolveStoreMediaUrl(line.imageUrl)
                            : ''
                        const titleBits = [
                          typeof line.productName === 'string' ? line.productName : '',
                          typeof line.variantName === 'string' ? line.variantName : '',
                        ]
                          .map((t) => t.trim())
                          .filter(Boolean)
                        const imgAlt =
                          titleBits.join(' · ') ||
                          (typeof line.sku === 'string' ? line.sku : `Mục ${idx + 1}`)
                        const specs = contractQuoteLineSpecs(line)

                        return (
                          <tr key={lid}>
                            <td className="px-4 py-3 align-middle">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={imgAlt}
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
                            <td className="px-4 py-3 align-middle min-w-[200px]">
                              <p className="font-bold text-slate-900 dark:text-white leading-snug">
                                {line.productName != null
                                  ? String(line.productName)
                                  : line.sku != null
                                    ? String(line.sku)
                                    : `Dòng ${idx + 1}`}
                              </p>
                              {line.variantName != null && String(line.variantName).trim() ? (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {String(line.variantName)}
                                </p>
                              ) : null}
                              {line.sku != null ? (
                                <p className="text-xs font-mono text-slate-400 mt-0.5">{String(line.sku)}</p>
                              ) : null}
                              {specs ? (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                                  {specs}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap align-middle">
                              {line.quantity ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap align-middle">
                              {formatMoneyVnd(line.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary whitespace-nowrap align-middle">
                              {formatMoneyVnd(line.subTotal)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {orders.length > 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">Đơn hàng liên quan</h3>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((o, idx) => (
                    <li key={o.orderCode ?? o.id ?? idx} className="px-4 py-3 flex flex-wrap justify-between gap-2">
                      <span className="font-mono text-sm">
                        {o.orderCode != null ? String(o.orderCode) : `#${o.id}`}
                      </span>
                      {o.orderCode ? (
                        <Link
                          to={`/partner/orders/${encodeURIComponent(String(o.orderCode))}`}
                          className="text-primary text-sm font-bold hover:underline"
                        >
                          Xem đơn
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

      <ContractConfirmModal
        key={confirmSeq}
        open={confirmOpen}
        onClose={() => !confirmBusy && setConfirmOpen(false)}
        contractLabel={String(data?.contractNumber ?? contractNumber)}
        busy={confirmBusy}
        onConfirm={async (notes) => {
          await handleConfirmApi(notes)
        }}
      />
    </div>
  )
}
