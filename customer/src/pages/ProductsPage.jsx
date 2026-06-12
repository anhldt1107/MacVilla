import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductFilters } from '../components/products/ProductFilters'
import { SortBar } from '../components/products/SortBar'
import { ProductGrid } from '../components/products/ProductGrid'
import { Pagination } from '../components/products/Pagination'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import {
  storeFetchProducts,
  storeFetchCategoryTree,
  storeFetchProductAttributeOptions,
} from '../api/store/storeCatalogApi'
import { mapStoreProductToListingCard } from '../lib/catalog/mapStoreProductToListingCard'
import { findCategoryPathById } from '../lib/catalog/categoryTreePath'
import {
  FILTER_PRICE_RANGES,
  findPriceBandIdFromUrl,
} from '../data/productListingFilters'
import {
  STORE_SORT_DEFAULT,
  normalizeStoreSort,
} from '../data/storeCatalogSort'
import { useCompare } from '../contexts/CompareContext'
import { MAX_COMPARE } from '../lib/compare/compareShared'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'

const PAGE_SIZE = 12

/** @param {string | null | undefined} csv */
function parseAttributeCsv(csv) {
  if (csv == null || String(csv).trim() === '') return []
  const out = []
  for (const part of String(csv).split(',')) {
    const id = Number.parseInt(part.trim(), 10)
    if (Number.isFinite(id) && id > 0) out.push(id)
  }
  return [...new Set(out)].sort((a, b) => a - b)
}

/** @param {URLSearchParams} sp */
function parseAttributeValueIds(sp) {
  return parseAttributeCsv(sp.get('attributeValueIds'))
}

const DEFAULT_BREADCRUMBS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', href: null },
]

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { items: compareItems, toggleCompared } = useCompare()

  const compareIdSet = useMemo(
    () => new Set(compareItems.map((x) => x.id)),
    [compareItems]
  )

  const categoryIdRaw = searchParams.get('categoryId')
  const categoryId = useMemo(() => {
    if (categoryIdRaw == null || categoryIdRaw === '') return null
    const n = parseInt(categoryIdRaw, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [categoryIdRaw])

  const page = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    return Number.isFinite(p) && p > 0 ? p : 1
  }, [searchParams])

  const searchQuery = useMemo(() => {
    const s = searchParams.get('search')
    if (s == null || String(s).trim() === '') return ''
    return String(s).trim()
  }, [searchParams])

  const filterMinPrice = useMemo(() => {
    const raw = searchParams.get('minPrice')
    if (raw == null || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : null
  }, [searchParams])

  const filterMaxPrice = useMemo(() => {
    const raw = searchParams.get('maxPrice')
    if (raw == null || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : null
  }, [searchParams])

  const attributeIdsParamRaw = searchParams.get('attributeValueIds') ?? ''

  const attributeValueIds = useMemo(
    () => parseAttributeCsv(attributeIdsParamRaw),
    [attributeIdsParamRaw]
  )

  const sortKey = useMemo(
    () => normalizeStoreSort(searchParams.get('sort')),
    [searchParams]
  )

  const inStockOnly = useMemo(() => searchParams.get('inStockOnly') === 'true', [searchParams])

  const selectedPriceBandId = useMemo(
    () => findPriceBandIdFromUrl(filterMinPrice, filterMaxPrice),
    [filterMinPrice, filterMaxPrice]
  )

  const [loadState, setLoadState] = useState('loading')
  const [listPayload, setListPayload] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [categoryTree, setCategoryTree] = useState(null)
  const [attributeFilterGroups, setAttributeFilterGroups] = useState(/** @type {any[]} */ ([]))

  useEffect(() => {
    let cancelled = false
    storeFetchCategoryTree()
      .then((data) => {
        if (cancelled) return
        setCategoryTree(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
        setCategoryTree(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setAttributeFilterGroups([])
    })
    storeFetchProductAttributeOptions({
      categoryId,
      includeSubcategories: true,
      search: searchQuery || null,
      minPrice: filterMinPrice,
      maxPrice: filterMaxPrice,
      inStockOnly,
    })
      .then((data) => {
        if (cancelled) return
        setAttributeFilterGroups(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
        setAttributeFilterGroups([])
      })

    return () => {
      cancelled = true
    }
  }, [categoryId, searchQuery, filterMinPrice, filterMaxPrice, inStockOnly])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setLoadState('loading')
      setLoadError('')
    })
    storeFetchProducts({
      page,
      pageSize: PAGE_SIZE,
      categoryId,
      includeSubcategories: true,
      search: searchQuery || null,
      minPrice: filterMinPrice,
      maxPrice: filterMaxPrice,
      sort:
        sortKey && sortKey !== STORE_SORT_DEFAULT ? sortKey : null,
      inStockOnly,
      attributeValueIds: attributeValueIds.length ? attributeValueIds : null,
    })
      .then((data) => {
        if (cancelled) return
        setListPayload(data)
        setLoadState('success')
      })
      .catch((err) => {
        if (cancelled) return
        setListPayload(null)
        setLoadError(getApiErrorMessage(err))
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [
    page,
    categoryId,
    searchQuery,
    filterMinPrice,
    filterMaxPrice,
    sortKey,
    inStockOnly,
    attributeIdsParamRaw,
  ])

  useEffect(() => {
    if (!listPayload || loadState !== 'success') return
    const tp = Math.max(
      1,
      Math.ceil((listPayload.totalCount || 0) / PAGE_SIZE)
    )
    if (page > tp) {
      queueMicrotask(() => {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('page')
            return next
          },
          { replace: true }
        )
      })
    }
  }, [listPayload, loadState, page, setSearchParams])

  const products = useMemo(() => {
    const items = listPayload?.items
    if (!Array.isArray(items)) return []
    return items.map(mapStoreProductToListingCard)
  }, [listPayload])

  const totalCount = listPayload?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const categoryPath = useMemo(() => {
    if (categoryId == null || !categoryTree?.length) return null
    return findCategoryPathById(categoryTree, categoryId)
  }, [categoryId, categoryTree])

  const headingTitle = useMemo(() => {
    if (searchQuery) {
      return `Kết quả cho “${searchQuery}”`
    }
    if (categoryPath?.length) {
      return categoryPath[categoryPath.length - 1].name
    }
    if (categoryId && products.length > 0 && products[0]?.tag) {
      return products[0].tag
    }
    if (categoryId) return 'Sản phẩm theo danh mục'
    return 'Tất cả sản phẩm'
  }, [categoryId, categoryPath, products, searchQuery])

  const breadcrumbs = useMemo(() => {
    if (!categoryId) return DEFAULT_BREADCRUMBS

    if (categoryPath?.length) {
      const items = [
        { label: 'Trang chủ', href: '/' },
        { label: 'Sản phẩm', href: '/products' },
      ]
      categoryPath.forEach((node, idx) => {
        const isLast = idx === categoryPath.length - 1
        const href = isLast
          ? null
          : `/products?categoryId=${node.id}`
        items.push({ label: node.name, href })
      })
      return items
    }

    const label =
      products.length > 0 && products[0]?.tag
        ? products[0].tag
        : 'Danh mục'
    return [
      { label: 'Trang chủ', href: '/' },
      { label: 'Sản phẩm', href: '/products' },
      { label, href: null },
    ]
  }, [categoryId, categoryPath, products])

  const handlePageChange = useCallback(
    (nextPage) => {
      const p = Math.min(Math.max(1, nextPage), totalPages)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (p <= 1) next.delete('page')
        else next.set('page', String(p))
        return next
      })
    },
    [setSearchParams, totalPages]
  )

  const handleCompareChange = useCallback(
    (productId, checked) => {
      const prod = products.find((p) => p.id === productId)
      if (!prod) return
      toggleCompared(
        {
          id: productId,
          slug: prod.slug ?? null,
          name: prod.name,
          image: prod.image,
        },
        checked
      )
    },
    [products, toggleCompared]
  )

  const compareAddBlockedFor = useCallback(
    (productId) =>
      !compareIdSet.has(productId) &&
      compareItems.length >= MAX_COMPARE,
    [compareIdSet, compareItems.length]
  )

  const handlePriceBandChange = useCallback(
    (/** @type {string} */ id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const prevMinRaw = prev.get('minPrice')
          const prevMaxRaw = prev.get('maxPrice')
          const curMin =
            prevMinRaw != null && prevMinRaw !== ''
              ? Number(prevMinRaw)
              : null
          const curMax =
            prevMaxRaw != null && prevMaxRaw !== ''
              ? Number(prevMaxRaw)
              : null
          const currentBand = findPriceBandIdFromUrl(
            curMin != null && Number.isFinite(curMin) ? curMin : null,
            curMax != null && Number.isFinite(curMax) ? curMax : null
          )
          let bandId = id
          if (id === currentBand && id !== 'all') {
            bandId = 'all'
          }

          next.delete('page')
          const range = FILTER_PRICE_RANGES.find((r) => r.id === bandId)
          if (!range || bandId === 'all') {
            next.delete('minPrice')
            next.delete('maxPrice')
            return next
          }
          if (range.minPrice != null) {
            next.set('minPrice', String(range.minPrice))
          } else {
            next.delete('minPrice')
          }
          if (range.maxPrice != null) {
            next.set('maxPrice', String(range.maxPrice))
          } else {
            next.delete('maxPrice')
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleClearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('minPrice')
        next.delete('maxPrice')
        next.delete('page')
        next.delete('inStockOnly')
        next.delete('attributeValueIds')
        next.delete('sort')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const handleSortChange = useCallback(
    (/** @type {string} */ id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('page')
          if (!id || id === STORE_SORT_DEFAULT) next.delete('sort')
          else next.set('sort', id)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleToggleAttributeValue = useCallback(
    (/** @type {number} */ valueId) => {
      if (!Number.isFinite(valueId) || valueId <= 0) return
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev)
          n.delete('page')
          const cur = parseAttributeValueIds(n)
          const set = new Set(cur)
          if (set.has(valueId)) set.delete(valueId)
          else set.add(valueId)
          const sorted = [...set].sort((a, b) => a - b)
          if (sorted.length === 0) n.delete('attributeValueIds')
          else n.set('attributeValueIds', sorted.join(','))
          return n
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  return (
    <main className="container mx-auto px-4 lg:px-8 py-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">
          {headingTitle}
        </h2>
        {searchQuery || !categoryId ? (
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            {searchQuery
              ? 'Kết quả trong danh mục sản phẩm.'
              : 'Khám phá thiết bị phòng tắm, nhà bếp và giải pháp gia dụng từ Macvilla.'}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <ProductFilters
          selectedPriceBandId={selectedPriceBandId}
          onPriceBandChange={handlePriceBandChange}
          attributeGroups={attributeFilterGroups}
          selectedAttributeIds={attributeValueIds}
          onToggleAttributeValue={handleToggleAttributeValue}
          onClearFilters={handleClearFilters}
        />
        <div className="flex-1 min-w-0">
          <SortBar
            totalProducts={totalCount}
            sort={sortKey}
            onSortChange={handleSortChange}
          />
          {loadState === 'loading' ? (
            <p className="py-12 text-center text-slate-500 dark:text-slate-400">
              Đang tải sản phẩm…
            </p>
          ) : null}
          {loadState === 'error' ? (
            <p
              className="py-12 text-center text-red-600 dark:text-red-400"
              role="alert"
            >
              {loadError}
            </p>
          ) : null}
          {loadState === 'success' && products.length === 0 ? (
            <p className="py-12 text-center text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'Không tìm thấy sản phẩm phù hợp. Thử từ khóa khác.'
                : 'Không có sản phẩm trong danh mục này.'}
            </p>
          ) : null}
          {loadState === 'success' && products.length > 0 ? (
            <ProductGrid
              products={products}
              compareIds={compareIdSet}
              onCompareChange={handleCompareChange}
              compareAddBlocked={compareAddBlockedFor}
            />
          ) : null}
          {loadState === 'success' && totalPages > 1 ? (
            <Pagination
              current={page}
              total={totalPages}
              onPageChange={handlePageChange}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}
