import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerHeaderUser } from '../components/partner/PartnerHeaderUser'
import {
  storeFetchProducts,
  storeFetchProductDetail,
  storeFetchVariantBySku,
} from '../api/store/storeCatalogApi'
import { storeB2bCreateQuoteRequest } from '../api/store/storeB2bQuotesApi'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../lib/auth/mapValidationErrors'
import { useAuth } from '../contexts/AuthContext'

const _viNumberFmt = new Intl.NumberFormat('vi-VN')

function formatMoney(value) {
  return _viNumberFmt.format(value) + ' đ'
}

function parseMoney(str) {
  const num = parseInt(String(str).replace(/\D/g, ''), 10)
  return isNaN(num) ? 0 : num
}

/** Đơn giá ô nhập (chỉ số nguyên, có dấu phân hàng nghìn vn-VN, không hậu tố ₫). */
function formatThousandsInt(n) {
  const x = Math.round(Number(n))
  if (!Number.isFinite(x)) return ''
  return _viNumberFmt.format(x)
}

/** Chuẩn hóa ô đơn giá đang nhập → chuỗi có chia nhóm cho dễ đọc. */
function normalizeEditableUnitPrice(value) {
  const digitsOnly = String(value ?? '').replace(/\D/g, '')
  if (digitsOnly === '') return ''
  const n = parseInt(digitsOnly, 10)
  if (!Number.isFinite(n)) return ''
  return _viNumberFmt.format(n)
}

/**
 * Dùng chung cho SKU API và chi tiết SP (camelCase FE).
 * @param {{ productName: string, productId: number, id: number, sku: string, variantName?: string | null, retailPrice?: unknown }} raw
 */
function buildQuoteRowFromVariant(raw) {
  const priceNum =
    raw.retailPrice != null && !Number.isNaN(Number(raw.retailPrice))
      ? Math.round(Number(raw.retailPrice))
      : 0
  const price = formatThousandsInt(priceNum)
  const vn = (raw.variantName || '').trim()
  const productName = (raw.productName || '').trim()
  const sku = String(raw.sku || '').trim() || `#${raw.id}`
  const isDefault = !vn || /^mặc định/i.test(vn) || vn.toLowerCase() === 'default'
  const cleanedVn = vn.replace(/\s*\(seed\)\s*$/i, '').trim()
  const name = isDefault
    ? productName || sku
    : `${productName || sku} — ${cleanedVn}`
  const productTitle = productName || sku
  /** Nhãn lưu kèm ghi chú gửi BE: biến thể mặc định → tên SP; còn lại → tên biến thể. */
  const variantNoteLabel = isDefault
    ? productTitle
    : cleanedVn || productTitle
  return {
    id: `variant-${raw.id}`,
    variantId: raw.id,
    productId: raw.productId,
    sku,
    name,
    variantNoteLabel,
    unitPrice: price,
    qty: 1,
    note: '',
  }
}

/** @param {Awaited<ReturnType<typeof storeFetchVariantBySku>>} v */
function variantToRow(v) {
  const productId = typeof v.productId === 'number' ? v.productId : Number(v.productId) || 0
  const id = typeof v.id === 'number' ? v.id : Number(v.id) || 0
  return buildQuoteRowFromVariant({
    productName: String(v.productName ?? ''),
    productId,
    id,
    sku: String(v.sku ?? ''),
    variantName: v.variantName ?? '',
    retailPrice: v.retailPrice,
  })
}

/**
 * @param {Record<string, unknown>} productDetail — store product detail dto
 * @param {Record<string, unknown>} variant — item trong detail.variants
 */
function detailVariantToRow(productDetail, variant) {
  const pidRaw = productDetail?.id
  const productId =
    pidRaw != null && Number.isFinite(Number(pidRaw)) ? Number(pidRaw) : 0
  const pname = typeof productDetail?.name === 'string' ? productDetail.name : ''
  const vidRaw = variant?.id
  const vid = vidRaw != null && Number.isFinite(Number(vidRaw)) ? Number(vidRaw) : 0
  return buildQuoteRowFromVariant({
    productName: pname,
    productId,
    id: vid,
    sku: typeof variant?.sku === 'string' ? variant.sku : String(variant?.sku ?? ''),
    variantName: variant?.variantName != null ? String(variant.variantName) : '',
    retailPrice: variant?.retailPrice ?? variant?.RetailPrice,
  })
}

/** Mỗi dòng: "tên biến thể - ghi chú," rồi xuống dòng (gửi trong `notes` → `CustomerNotes`). */
function buildQuoteNotes(rows) {
  return rows
    .map((r) => {
      const note = (r.note || '').trim()
      const label = String(r.variantNoteLabel || r.name || r.sku).trim()
      return `${label} - ${note || '—'},`
    })
    .join('\n')
}

function mergeRowIntoItems(prev, row) {
  const idx = prev.findIndex((r) => r.sku.toLowerCase() === row.sku.toLowerCase())
  if (idx >= 0) {
    const next = [...prev]
    const cur = next[idx]
    next[idx] = {
      ...cur,
      qty: Number(cur.qty) + 1,
      unitPrice: row.unitPrice,
      name: row.name,
      variantNoteLabel: row.variantNoteLabel,
      variantId: row.variantId,
      productId: row.productId,
    }
    return next
  }
  return [...prev, row]
}

/** @typedef {ReturnType<typeof buildQuoteRowFromVariant>} QuoteTableRow */

export function PartnerQuotationCreatePage() {
  const searchWrapRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  const [searchProduct, setSearchProduct] = useState('')
  const [productSuggestions, setProductSuggestions] = useState(/** @type {unknown[]} */ ([]))
  const [searchSuggestLoading, setSearchSuggestLoading] = useState(false)
  const [variantPicker, setVariantPicker] = useState(
    /** @type {null | { productName: string, productId: number, variants: Record<string, unknown>[] }} */
    (null),
  )

  const [items, setItems] = useState(
    /** @type {QuoteTableRow[]} */ ([])
  )
  const [quickAddBusy, setQuickAddBusy] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({})
  )

  const { accessToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function onMouseDown(ev) {
      const el = searchWrapRef.current
      if (!el || !(ev.target instanceof Node) || !el.contains(ev.target)) {
        setVariantPicker(null)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const totalAmount = useMemo(() => {
    return items.reduce((sum, row) => sum + parseMoney(row.unitPrice) * (Number(row.qty) || 0), 0)
  }, [items])

  const addMergedRow = useCallback((/** @type {QuoteTableRow} */ row) => {
    setItems((prev) => mergeRowIntoItems(prev, row))
  }, [])

  const resetQuickSearchUi = useCallback(() => {
    setSearchProduct('')
    setProductSuggestions([])
    setVariantPicker(null)
    setSearchError('')
  }, [])

  /** Gợi ý danh mục theo debounce (~300 ms) */
  useEffect(() => {
    const q = searchProduct.trim()
    if (!q || q.length < 1) {
      setProductSuggestions([])
      setSearchSuggestLoading(false)
      return
    }
    let cancelled = false
    setSearchSuggestLoading(true)
    const t = window.setTimeout(async () => {
      try {
        const data = await storeFetchProducts({
          search: q,
          page: 1,
          pageSize: 12,
        })
        const list = Array.isArray(data?.items) ? data.items : []
        if (!cancelled) setProductSuggestions(list)
      } catch {
        if (!cancelled) setProductSuggestions([])
      } finally {
        if (!cancelled) setSearchSuggestLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [searchProduct])

  const handlePickProductSuggestion = useCallback(
    async (/** @type {Record<string, unknown>} */ suggestion) => {
      const pid = suggestion?.id
      const productKey =
        pid != null && Number.isFinite(Number(pid)) ? String(Number(pid)) : null
      if (!productKey) return
      setSearchError('')
      setVariantPicker(null)
      setProductSuggestions([])
      setQuickAddBusy(true)
      try {
        const detail = await storeFetchProductDetail(productKey)
        const dv = detail && typeof detail === 'object' ? /** @type {Record<string, unknown>} */ (detail) : {}
        const rawVariants = dv.variants
        const variants = Array.isArray(rawVariants) ? rawVariants : []
        if (variants.length === 0) {
          setSearchError('Sản phẩm này chưa có biến thể để báo giá.')
          return
        }
        if (variants.length === 1) {
          const row = detailVariantToRow(dv, /** @type {Record<string, unknown>} */ (variants[0]))
          addMergedRow(row)
          resetQuickSearchUi()
          return
        }
        const productId =
          dv.id != null && Number.isFinite(Number(dv.id)) ? Number(dv.id) : Number(productKey)
        const productName = typeof dv.name === 'string' ? dv.name : ''
        setVariantPicker({
          productName,
          productId,
          variants: variants.map((v) =>
            v && typeof v === 'object' ? /** @type {Record<string, unknown>} */ (v) : {},
          ),
        })
        setSearchProduct('')
      } catch (err) {
        setSearchError(getApiErrorMessage(err))
      } finally {
        setQuickAddBusy(false)
      }
    },
    [addMergedRow, resetQuickSearchUi]
  )

  const handlePickVariantFromPanel = useCallback(
    (/** @type {Record<string, unknown>} */ variant) => {
      if (!variantPicker) return
      const pseudoDetail = /** @type {Record<string, unknown>} */ ({
        id: variantPicker.productId,
        name: variantPicker.productName,
      })
      const row = detailVariantToRow(pseudoDetail, variant)
      addMergedRow(row)
      resetQuickSearchUi()
    },
    [variantPicker, addMergedRow, resetQuickSearchUi]
  )

  /** Tra cứu trực tiếp theo SKU (Enter / nút Tra SKU). */
  const handleAddBySkuFallback = useCallback(async () => {
    const sku = searchProduct.trim()
    setSearchError('')
    setVariantPicker(null)
    setProductSuggestions([])
    if (!sku) {
      setSearchError('Nhập từ khóa hoặc SKU.')
      return
    }
    setQuickAddBusy(true)
    try {
      const data = await storeFetchVariantBySku(sku)
      const row = variantToRow(data)
      addMergedRow(row)
      resetQuickSearchUi()
    } catch (err) {
      setSearchError(getApiErrorMessage(err))
    } finally {
      setQuickAddBusy(false)
    }
  }, [searchProduct, addMergedRow, resetQuickSearchUi])

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((row) => row.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setFieldErrors({})
    if (!isAuthenticated || !accessToken) {
      setSubmitError('Vui lòng đăng nhập tài khoản doanh nghiệp để gửi yêu cầu.')
      return
    }
    if (items.length === 0) {
      setSubmitError('Chưa có mặt hàng trong danh sách.')
      return
    }
    const missingVariant = items.find(
      (r) => r.variantId == null || Number.isNaN(Number(r.variantId)),
    )
    if (missingVariant) {
      setSubmitError(`Dòng "${missingVariant.sku}" thiếu mã biến thể.`)
      return
    }
    const payloadItems = items.map((r) => ({
      variantId: Number(r.variantId),
      quantity: Math.max(1, Math.floor(Number(r.qty)) || 1),
    }))
    const notesCombined = [generalNotes.trim(), buildQuoteNotes(items)]
      .filter(Boolean)
      .join('\n\n')
    setSubmitting(true)
    try {
      const data = await storeB2bCreateQuoteRequest(accessToken, {
        items: payloadItems,
        ...(notesCombined ? { notes: notesCombined } : {}),
      })
      navigate('/partner/quotation/history', {
        replace: false,
        state: {
          quoteSubmitted: true,
          quoteCode: data.quoteCode,
          quoteId: data.id,
        },
      })
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setSubmitError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const showSuggestions =
    !!searchProduct.trim() && (!!searchSuggestLoading || productSuggestions.length > 0)

  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/partner/quotation/history" className="text-slate-500 hover:text-primary transition-colors">
            Báo giá
          </Link>
          <Icon name="chevron_right" className="text-xs text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">Tạo yêu cầu mới</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative"
            aria-label="Thông báo"
          >
            <Icon name="notifications" className="text-xl" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <PartnerHeaderUser size="sm" />
        </div>
      </header>

      {/* Body */}
      <div className="w-full flex-1 space-y-6 px-4 sm:px-6 py-6 sm:py-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tạo yêu cầu báo giá</h2>
        </div>

        {submitError ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}
        {Object.keys(fieldErrors).length > 0 ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
          >
            {Object.values(fieldErrors)[0]}
          </div>
        ) : null}

        {/* Thêm sản phẩm nhanh */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Icon name="add_shopping_cart" className="text-xl" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Thêm nhanh</h3>
          </div>

          <div ref={searchWrapRef} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Icon name="search" className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchProduct}
                  disabled={quickAddBusy}
                  onChange={(e) => {
                    setSearchProduct(e.target.value)
                    setSearchError('')
                    setVariantPicker(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleAddBySkuFallback()
                      return
                    }
                    if (e.key === 'Escape') {
                      setVariantPicker(null)
                      setProductSuggestions([])
                    }
                  }}
                  placeholder="Tìm hoặc nhập SKU…"
                  autoComplete="off"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 disabled:opacity-60"
                />

                {showSuggestions ? (
                  <ul
                    className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
                    role="listbox"
                  >
                    {searchSuggestLoading ? (
                      <li className="px-4 py-3 text-sm text-slate-500">Đang tìm…</li>
                    ) : null}
                    {!searchSuggestLoading && productSuggestions.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-slate-500">Không thấy sản phẩm phù hợp.</li>
                    ) : null}
                    {!searchSuggestLoading
                      ? productSuggestions.map((row) => {
                          const r = /** @type {Record<string, unknown>} */ (
                            row && typeof row === 'object' ? row : {}
                          )
                          const pid = r.id != null ? String(r.id) : ''
                          const name = r.name != null ? String(r.name) : '(Không có tên)'
                          return (
                            <li key={pid || name}>
                              <button
                                type="button"
                                disabled={quickAddBusy}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => void handlePickProductSuggestion(r)}
                                className="w-full text-left px-4 py-2.5 hover:bg-primary/5 dark:hover:bg-primary/10 border-b border-slate-100 dark:border-slate-800 last:border-0 disabled:opacity-60"
                              >
                                <span className="font-medium text-sm text-slate-900 dark:text-slate-100 block truncate">
                                  {name}
                                </span>
                              </button>
                            </li>
                          )
                        })
                      : null}
                  </ul>
                ) : null}

                {!showSuggestions &&
                variantPicker &&
                variantPicker.variants?.length &&
                variantPicker.variants.length > 1 ? (
                  <div className="relative z-20 mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 truncate">
                      {variantPicker.productName}
                    </p>
                    <ul className="space-y-1 max-h-56 overflow-y-auto">
                      {variantPicker.variants.map((vv) => {
                        const sku = vv.sku != null ? String(vv.sku) : ''
                        const vname =
                          vv.variantName != null ? String(vv.variantName).trim() : ''
                        const line = vname || sku || `#${vv.id}`
                        const price =
                          vv.retailPrice != null
                            ? formatMoney(Number(vv.retailPrice))
                            : '—'
                        return (
                          <li key={String(vv.id ?? sku)}>
                            <button
                              type="button"
                              disabled={quickAddBusy}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handlePickVariantFromPanel(vv)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left hover:bg-white dark:hover:bg-slate-900 disabled:opacity-60"
                            >
                              <span className="text-sm text-slate-900 dark:text-slate-100 min-w-0">
                                <span className="font-mono text-xs block text-primary">{sku}</span>
                                <span className="block truncate">{line}</span>
                              </span>
                              <span className="text-xs text-slate-500 shrink-0">{price}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void handleAddBySkuFallback()}
                disabled={quickAddBusy}
                className="border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-60 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Icon name="barcode_scanner" className="text-lg" />
                {quickAddBusy ? 'Đang tải…' : 'Tra SKU'}
              </button>
            </div>

            {searchError ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {searchError}
              </p>
            ) : null}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
            <Icon name="notes" className="text-xl text-primary" />
            <h3 className="font-bold text-lg">Ghi chú</h3>
          </div>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={2}
            placeholder="Ghi chú cho báo giá (nếu có)"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y min-h-[72px]"
          />
        </section>

        {/* Danh sách sản phẩm */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Icon name="list_alt" className="text-xl" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Danh sách</h3>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium text-slate-500 tabular-nums">
              {items.length} dòng
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">SKU / tên</th>
                  <th className="px-6 py-4 w-40">Đơn giá</th>
                  <th className="px-6 py-4 w-32 text-center">SL</th>
                  <th className="px-6 py-4">Ghi chú</th>
                  <th className="px-6 py-4 w-20 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Chưa có mặt hàng nào.
                    </td>
                  </tr>
                ) : null}
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase">{row.sku}</span>
                        <span className="text-xs text-slate-500">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              row.id,
                              'unitPrice',
                              normalizeEditableUnitPrice(e.target.value),
                            )
                          }
                          className="w-full py-1.5 px-2 text-sm border-transparent bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 outline-none text-right font-medium text-slate-900 dark:text-slate-100"
                        />
                        <span className="absolute right-0 top-1.5 text-[10px] text-slate-400">đ</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          value={row.qty}
                          onChange={(e) => updateItem(row.id, 'qty', e.target.value)}
                          min={1}
                          className="w-20 py-1.5 px-2 text-center text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) => updateItem(row.id, 'note', e.target.value)}
                        placeholder=""
                        className="w-full py-1.5 px-2 text-xs border-transparent bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 outline-none italic text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(row.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Xóa"
                      >
                        <Icon name="delete_outline" className="text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-right border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Tạm tính: <span className="text-lg font-bold text-primary ml-2">{formatMoney(totalAmount)}</span>
            </p>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-4 sticky bottom-0 z-10">
        <div className="flex w-full flex-wrap justify-between items-center gap-4">
          <Link
            to="/partner/quotation/history"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold px-4 py-2 transition-all"
          >
            <Icon name="keyboard_backspace" />
            Quay lại
          </Link>
          <div className="flex gap-4">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              onClick={(e) => void handleSubmit(e)}
              disabled={submitting || items.length === 0}
              className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Icon name="send" className="text-lg" />
              {submitting ? 'Đang gửi…' : 'Gửi'}
            </button>
          </div>
        </div>
      </footer>
    </>
  )
}
