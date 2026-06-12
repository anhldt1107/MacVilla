import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { storeFetchProductDetail } from '../api/store/storeCatalogApi'
import { ApiError } from '../api/httpClient'
import {
  buildTechnicalSpecsFromDetail,
  buildGalleryFromDetail,
  resolveDetailPricing,
  STORE_PRODUCT_PLACEHOLDER_IMAGE,
} from '../lib/catalog/mapStoreProductDetail'
import { useCompare } from '../contexts/CompareContext'
import {
  idsToCompareQuery,
  parseCompareIdsFromSearchParams,
  pickDefaultVariantForCompare,
} from '../lib/compare/compareShared'

function formatPrice(value) {
  const n = Number(value)
  if (value == null || Number.isNaN(n) || n <= 0) {
    return 'Liên hệ'
  }
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ'
}

/**
 * @param {{ label: string, value: string }[][]} perProductRows
 */
function orderedSpecLabels(perProductRows) {
  /** @type {string[]} */
  const ordered = []
  const seen = new Set()
  for (const rows of perProductRows) {
    for (const row of rows) {
      const label = typeof row?.label === 'string' ? row.label.trim() : ''
      if (!label || seen.has(label)) continue
      seen.add(label)
      ordered.push(label)
    }
  }
  return ordered
}

/** @typedef {{ id: number, status: 'loading'|'ok'|'error', detail?: object, message?: string }} ColState */

/** @returns {React.ReactElement} */
function CompareProductThumb({ detail }) {
  const g = detail
    ? buildGalleryFromDetail(detail)
    : { mainImage: STORE_PRODUCT_PLACEHOLDER_IMAGE }
  const name = typeof detail?.name === 'string' ? detail.name : 'Sản phẩm'
  const slug =
    typeof detail?.slug === 'string' && detail.slug.trim()
      ? detail.slug.trim()
      : null
  const id = typeof detail?.id === 'number' ? detail.id : null
  const detailUrl =
    slug ? `/products/${encodeURIComponent(slug)}` : `/products/${id ?? ''}`
  const src =
    typeof g.mainImage === 'string' && g.mainImage.trim()
      ? g.mainImage
      : STORE_PRODUCT_PLACEHOLDER_IMAGE

  return (
    <div className="flex flex-col items-center gap-2">
      <Link
        to={detailUrl}
        className="aspect-square w-full max-w-[120px] rounded-lg bg-slate-50 dark:bg-slate-800/80 overflow-hidden border border-slate-200 dark:border-slate-600"
      >
        <img src={src} alt="" className="w-full h-full object-contain" />
      </Link>
      <Link
        to={detailUrl}
        className="text-sm font-semibold text-center text-primary hover:underline block line-clamp-2 px-1"
      >
        {name}
      </Link>
    </div>
  )
}

export function ProductComparePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { removeCompared, clearCompare } = useCompare()
  /** @type {React.MutableRefObject<number | null>} */
  const nonceRef = useRef(null)

  const idsOrdered = useMemo(
    () => parseCompareIdsFromSearchParams(searchParams),
    [searchParams]
  )

  /** @type {ColState[]} */
  const [columns, setColumns] = useState([])

  const replaceIdsUrl = useCallback(
    /** @param {number[]} ids */ (ids) => {
      const nextCsv = idsToCompareQuery(ids)
      if (!nextCsv) {
        navigate('/products', { replace: true })
        return
      }
      const nextSp = new URLSearchParams(searchParams)
      nextSp.set('ids', nextCsv)
      setSearchParams(nextSp, { replace: true })
    },
    [navigate, searchParams, setSearchParams]
  )

  useEffect(() => {
    nonceRef.current = Date.now()
    const myNonce = nonceRef.current

    const list = [...idsOrdered]
    if (!list.length) {
      navigate('/products', { replace: true })
      return undefined
    }

    /** @type {ColState[]} */
    const skeleton = list.map((id) => ({
      id,
      status: /** @type {const} */ ('loading'),
    }))
    queueMicrotask(() => {
      if (nonceRef.current !== myNonce) return
      setColumns(skeleton)
    })

    list.forEach((reqId, index) => {
      storeFetchProductDetail(reqId)
        .then((data) => {
          if (nonceRef.current !== myNonce) return
          const resolvedId =
            data && typeof data.id === 'number' ? data.id : reqId
          setColumns((prev) =>
            prev.map((c, idx) =>
              idx === index
                ? {
                    id: resolvedId,
                    status: /** @type {const} */ ('ok'),
                    detail: data && typeof data === 'object' ? data : null,
                  }
                : c
            )
          )
        })
        .catch((err) => {
          if (nonceRef.current !== myNonce) return
          const msg =
            err instanceof ApiError && err.status === 404
              ? 'Không tìm thấy sản phẩm.'
              : 'Không tải được sản phẩm.'
          setColumns((prev) =>
            prev.map((c, idx) =>
              idx === index
                ? {
                    ...c,
                    status: /** @type {const} */ ('error'),
                    message: msg,
                  }
                : c
            )
          )
        })
    })
    return undefined
  }, [idsOrdered, navigate])

  const handleRemoveColumnAt = useCallback(
    /** @param {number} idx */ (idx) => {
      const rawId = idsOrdered[idx]
      if (rawId == null || !Number.isFinite(rawId)) return
      removeCompared(rawId)
      const nextIds = idsOrdered.filter((_, i) => i !== idx)
      if (!nextIds.length) {
        clearCompare()
        navigate('/products')
        return
      }
      replaceIdsUrl(nextIds)
    },
    [
      clearCompare,
      idsOrdered,
      navigate,
      removeCompared,
      replaceIdsUrl,
    ]
  )

  const handleClearAll = useCallback(() => {
    clearCompare()
    navigate('/products')
  }, [clearCompare, navigate])

  const breadcrumbs = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/products' },
    { label: 'So sánh', href: null },
  ]

  const { labels: specLabels, matrixRows } = useMemo(() => {
    const perRows = columns.map((c) => {
      if (c.status !== 'ok' || !c.detail) return []
      const v = pickDefaultVariantForCompare(c.detail)
      return buildTechnicalSpecsFromDetail(c.detail, v)
    })
    const labels = orderedSpecLabels(perRows)
    const matrixRowsComputed = labels.map((label) =>
      perRows.map((rows) => {
        const hit = rows.find((r) => r.label === label)
        return hit?.value ?? '—'
      })
    )
    return { labels, matrixRows: matrixRowsComputed }
  }, [columns])

  const priceRow = useMemo(() => {
    return columns.map((c) => {
      if (c.status !== 'ok' || !c.detail)
        return c.status === 'loading' ? '…' : '—'
      const v = pickDefaultVariantForCompare(c.detail)
      const { price } = resolveDetailPricing(c.detail, v)
      return formatPrice(price)
    })
  }, [columns])

  return (
    <main className="container mx-auto px-4 lg:px-8 py-6 pb-28">
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
          So sánh sản phẩm
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm font-semibold text-slate-600 dark:text-slate-400 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Xóa tất cả
          </button>
          <Link
            to="/products"
            className="text-sm font-semibold text-primary px-4 py-2 rounded-full hover:underline inline-flex items-center"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full border-collapse text-sm min-w-[640px]">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-[1] bg-slate-50 dark:bg-slate-950 p-4 text-left font-bold border-b border-slate-200 dark:border-slate-700 min-w-[120px]"
              >
                Đặc điểm
              </th>
              {columns.map((col, idx) => (
                <th
                  key={`h-${idx}-${col.id}`}
                  scope="col"
                  className="p-3 align-bottom border-b border-slate-200 dark:border-slate-700 min-w-[180px]"
                >
                  <div className="flex justify-end pb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveColumnAt(idx)}
                      className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline"
                    >
                      Bỏ khỏi so sánh
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-[1] bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
              >
                Hình ảnh và tên
              </th>
              {columns.map((col, idx) => (
                <td
                  key={`name-${idx}-${col.id}`}
                  className="p-4 align-middle text-center border-b border-slate-200 dark:border-slate-700"
                >
                  {col.status === 'loading' ? (
                    <div className="space-y-2">
                      <div className="aspect-square max-w-[120px] mx-auto rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      <div className="h-4 max-w-[100px] mx-auto rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </div>
                  ) : null}
                  {col.status === 'error' ? (
                    <div className="text-center px-2">
                      <p className="text-red-600 dark:text-red-400 text-xs mb-2">
                        {col.message ?? 'Lỗi'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveColumnAt(idx)}
                        className="text-xs font-bold text-primary underline"
                      >
                        Gỡ cột này
                      </button>
                    </div>
                  ) : null}
                  {col.status === 'ok' && col.detail ? (
                    <CompareProductThumb detail={col.detail} />
                  ) : null}
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-[1] bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
              >
                Giá
              </th>
              {priceRow.map((cell, idx) => (
                <td
                  key={`price-${idx}`}
                  className="p-4 text-center font-semibold border-b border-slate-200 dark:border-slate-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
            {specLabels.map((label, rowIdx) => (
              <tr key={`spec-${label}`}>
                <th
                  scope="row"
                  className="sticky left-0 z-[1] bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 whitespace-normal"
                >
                  {label}
                </th>
                {matrixRows[rowIdx].map((cell, ci) => (
                  <td
                    key={`cell-${ci}-${rowIdx}`}
                    className="p-4 text-center border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
