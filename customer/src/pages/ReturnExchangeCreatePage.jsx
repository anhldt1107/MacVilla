import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { storeMeFetchOrderByCode } from '../api/store/storeMeOrdersApi'
import { storeMeCreateReturnExchangeRequest } from '../api/store/storeMeReturnExchangeApi'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { useAuth } from '../contexts/AuthContext'
import { ProductLineDisplay } from '../components/catalog/ProductLineDisplay'
import { extractProductLineFields } from '../lib/productLineDisplay'

const inputClass =
  'w-full min-w-0 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary'

/** @param {unknown} line */
function lineVariantId(line) {
  if (line == null || typeof line !== 'object') return NaN
  const o = /** @type {Record<string, unknown>} */ (line)
  if (o.variantId != null) return Number(o.variantId)
  if (o.productVariantId != null) return Number(o.productVariantId)
  return NaN
}

/** @param {unknown} line */
function lineOrderItemId(line) {
  if (line == null || typeof line !== 'object') return NaN
  const o = /** @type {Record<string, unknown>} */ (line)
  const id = o.orderItemId ?? o.id ?? o.Id
  return id != null ? Number(id) : NaN
}

/** @param {unknown} line */
function lineMaxQty(line) {
  if (line == null || typeof line !== 'object') return 0
  const o = /** @type {Record<string, unknown>} */ (line)
  const rq = o.returnableQuantity ?? o.ReturnableQuantity
  if (rq != null && Number.isFinite(Number(rq))) {
    const n = Math.floor(Number(rq))
    if (n >= 0) return n
  }
  const q = o.quantity
  const n = q != null ? Number(q) : 0
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function ReturnExchangeCreatePage() {
  const { accessToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderCodeFromUrl = searchParams.get('orderCode')?.trim() || ''

  const [orderCodeInput, setOrderCodeInput] = useState(orderCodeFromUrl)
  const [orderDetail, setOrderDetail] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadOrderError, setLoadOrderError] = useState('')

  const [reqType, setReqType] = useState(/** @type {'Return' | 'Exchange'} */ ('Return'))
  const [reason, setReason] = useState('')
  const [customerNote, setCustomerNote] = useState('')

  /** key: line index -> { qty: string, exchangeVariantId: string } */
  const [lineDraft, setLineDraft] = useState(() => /** @type {Record<number, { qty: string, exchangeVariantId: string }>} */ ({}))
  const [selectedIdx, setSelectedIdx] = useState(() => new Set())

  const [submitBusy, setSubmitBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
        const d = await storeMeFetchOrderByCode(accessToken, code)
        const obj = d && typeof d === 'object' ? /** @type {Record<string, unknown>} */ (d) : null
        setOrderDetail(obj)
        setSelectedIdx(new Set())
        setLineDraft({})
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

  const orderId = useMemo(() => {
    if (!orderDetail?.id) return null
    const n = Number(orderDetail.id)
    return Number.isFinite(n) ? n : null
  }, [orderDetail])

  const toggleLine = (idx) => {
    setSelectedIdx((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const setDraft = (idx, field, value) => {
    setLineDraft((prev) => ({
      ...prev,
      [idx]: {
        qty: field === 'qty' ? value : (prev[idx]?.qty ?? '1'),
        exchangeVariantId:
          field === 'exchangeVariantId'
            ? value
            : (prev[idx]?.exchangeVariantId ?? ''),
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!accessToken || orderId == null) {
      setSubmitError('Thiếu thông tin đơn hoặc phiên đăng nhập.')
      return
    }
    const r = reason.trim()
    if (!r) {
      setSubmitError('Vui lòng nhập lý do.')
      return
    }

    const itemPayload = []
    for (const idx of selectedIdx) {
      const line = lines[idx]
      const oid = lineOrderItemId(line)
      const vid = lineVariantId(line)
      if (!Number.isFinite(oid)) {
        setSubmitError(`Dòng ${idx + 1}: thiếu orderItemId — tải lại đơn.`)
        return
      }
      if (!Number.isFinite(vid)) continue
      const maxQ = lineMaxQty(line)
      if (maxQ <= 0) {
        setSubmitError(`Dòng ${idx + 1}: không còn số lượng được phép đổi/trả.`)
        return
      }
      const draft = lineDraft[idx] || { qty: '1', exchangeVariantId: '' }
      const q = Math.min(maxQ, Math.max(1, parseInt(String(draft.qty), 10) || 1))
      if (reqType === 'Exchange') {
        const ex = parseInt(String(draft.exchangeVariantId).trim(), 10)
        if (!Number.isFinite(ex)) {
          setSubmitError(`Dòng ${idx + 1}: nhập mã biến thể đổi sang (variantIdExchanged).`)
          return
        }
        itemPayload.push({
          orderItemId: oid,
          variantIdReturned: vid,
          variantIdExchanged: ex,
          quantity: q,
        })
      } else {
        itemPayload.push({
          orderItemId: oid,
          variantIdReturned: vid,
          variantIdExchanged: null,
          quantity: q,
        })
      }
    }

    if (itemPayload.length === 0) {
      setSubmitError('Chọn ít nhất một dòng hàng hợp lệ (còn số lượng đổi/trả).')
      return
    }

    const body = {
      orderId,
      type: reqType,
      reason: r,
      items: itemPayload,
    }
    const note = customerNote.trim()
    if (note) body.customerNote = note

    setSubmitBusy(true)
    try {
      const res = await storeMeCreateReturnExchangeRequest(accessToken, body)
      const o = res && typeof res === 'object' ? /** @type {Record<string, unknown>} */ (res) : null
      const ticket = o?.ticketNumber != null ? String(o.ticketNumber) : ''
      if (ticket) {
        navigate(`/account/returns/${encodeURIComponent(ticket)}`, { replace: true })
      } else {
        navigate('/account/returns', { replace: true })
      }
    } catch (err) {
      setSubmitError(getApiErrorMessage(err))
    } finally {
      setSubmitBusy(false)
    }
  }

  return (
    <AccountAccountShell
      hero={
        <div className="mb-6">
          <Link
            to="/account/returns"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <Icon name="arrow_back" className="text-lg" />
            Danh sách đổi / trả
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Tạo yêu cầu đổi / trả</h1>
        </div>
      }
    >
      <section className="max-w-4xl">
        {!isAuthenticated || !accessToken ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
            Vui lòng{' '}
            <Link to="/login" className="font-bold underline">
              đăng nhập
            </Link>{' '}
            để tạo yêu cầu.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-8">
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
            <>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white">2. Loại yêu cầu</h3>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rex_type"
                      checked={reqType === 'Return'}
                      onChange={() => setReqType('Return')}
                      className="text-primary"
                    />
                    <span className="text-sm font-medium">Trả hàng (Return)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rex_type"
                      checked={reqType === 'Exchange'}
                      onChange={() => setReqType('Exchange')}
                      className="text-primary"
                    />
                    <span className="text-sm font-medium">Đổi hàng (Exchange)</span>
                  </label>
                </div>
                <p className="text-xs text-slate-500">Đổi hàng: nhập biến thể nhận lại từng dòng.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white">3. Chọn dòng & số lượng</h3>
                {lines.length === 0 ? (
                  <p className="text-sm text-slate-500">Đơn không có dòng hàng.</p>
                ) : (
                  <ul className="space-y-3">
                    {lines.map((line, idx) => {
                      const vid = lineVariantId(line)
                      const maxQ = lineMaxQty(line)
                      const invalid = !Number.isFinite(vid)
                      const draft = lineDraft[idx] || { qty: '1', exchangeVariantId: '' }
                      const on = selectedIdx.has(idx)
                      return (
                        <li
                          key={/** @type {any} */ (line).id ?? idx}
                          className={`rounded-lg border p-4 ${
                            on
                              ? 'border-primary bg-primary/5 dark:bg-primary/10'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <label className="flex gap-3 items-start cursor-pointer">
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={invalid || maxQ <= 0}
                              onChange={() => toggleLine(idx)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0 space-y-2">
                              <ProductLineDisplay {...extractProductLineFields(line)} />
                              <p className="text-xs text-slate-500">
                                {invalid ? (
                                  <strong className="text-amber-600">Thiếu thông tin biến thể trên đơn</strong>
                                ) : (
                                  <>Còn được trả: {maxQ}</>
                                )}
                              </p>
                              {on && !invalid && maxQ > 0 ? (
                                <div className="flex flex-wrap gap-3 items-end">
                                  <div className="w-28">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                      SL trả
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={maxQ}
                                      className={inputClass}
                                      value={draft.qty}
                                      onChange={(e) => setDraft(idx, 'qty', e.target.value)}
                                    />
                                  </div>
                                  {reqType === 'Exchange' ? (
                                    <div className="flex-1 min-w-[200px]">
                                      <label className="block text-xs font-bold text-slate-500 mb-1">
                                        Variant đổi sang (ID)
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className={inputClass}
                                        value={draft.exchangeVariantId}
                                        onChange={(e) =>
                                          setDraft(idx, 'exchangeVariantId', e.target.value)
                                        }
                                        placeholder="VD: 105"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white">4. Lý do & ghi chú</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Lý do <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`${inputClass} min-h-[100px]`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Mô tả ngắn gọn lý do trả / đổi…"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Ghi chú thêm (không bắt buộc)
                  </label>
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Hướng dẫn giao nhận, thời gian liên hệ…"
                  />
                </div>
              </div>

              {submitError ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                >
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitBusy || selectedIdx.size === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold disabled:opacity-50"
                >
                  {submitBusy ? 'Đang gửi…' : 'Gửi yêu cầu'}
                </button>
                <Link
                  to="/account/returns"
                  className="inline-flex items-center px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold"
                >
                  Hủy
                </Link>
              </div>
            </>
          ) : null}
        </form>
      </section>
    </AccountAccountShell>
  )
}
