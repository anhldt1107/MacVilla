import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCartCount } from '../contexts/CartCountContext'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import {
  ProductGallery,
  ProductInfo,
  ComboPromo,
  TechnicalSpecs,
} from '../components/productDetail'
import {
  storeFetchCategoryTree,
  storeFetchProductDetail,
} from '../api/store/storeCatalogApi'
import { storeAddCartItem } from '../api/store/storeCartApi'
import { ApiError } from '../api/httpClient'
import { findCategoryPathById } from '../lib/catalog/categoryTreePath'
import {
  buildGalleryFromDetail,
  buildHighlightsFromDetail,
  buildTechnicalSpecsFromDetail,
  mapVariantsForUi,
  resolveDetailPricing,
  variantLooksInStock,
} from '../lib/catalog/mapStoreProductDetail'
import { useCompare } from '../contexts/CompareContext'
import { MAX_COMPARE } from '../lib/compare/compareShared'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { PRODUCT_DETAIL } from '../data/productDetail'
import { CartSuccessSnackbar } from '../components/ui/CartSuccessSnackbar'
import { Icon } from '../components/ui/Icon'

const DEFAULT_SERVICES = PRODUCT_DETAIL.services

export function ProductDetailPage() {
  const { id: slugOrId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken } = useAuth()
  const { applyCartDto } = useCartCount()
  const { items: compareItems, isCompared, toggleCompared } = useCompare()

  const [loadState, setLoadState] = useState('loading')
  const [detail, setDetail] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [categoryTree, setCategoryTree] = useState(null)
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [cartAction, setCartAction] = useState(
    /** @type {null | 'add' | 'buyNow'} */ (null)
  )
  const [addToCartError, setAddToCartError] = useState('')
  const [cartSnackMessage, setCartSnackMessage] = useState('')

  useEffect(() => {
    if (!cartSnackMessage) return
    const t = window.setTimeout(() => setCartSnackMessage(''), 5500)
    return () => window.clearTimeout(t)
  }, [cartSnackMessage])

  useEffect(() => {
    setAddToCartError('')
    setCartSnackMessage('')
  }, [selectedVariantId])

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
    const key = slugOrId
    queueMicrotask(() => {
      if (cancelled) return
      setLoadState('loading')
      setLoadError('')
      setNotFound(false)
      setDetail(null)
      setSelectedVariantId(null)
    })
    storeFetchProductDetail(key)
      .then((data) => {
        if (cancelled) return
        setDetail(data && typeof data === 'object' ? data : null)
        const variants = Array.isArray(data?.variants) ? data.variants : []
        const firstVariant = variants.find(
          (v) => v && typeof v.id === 'number'
        )
        setSelectedVariantId(firstVariant != null ? firstVariant.id : null)
        setLoadState('success')
      })
      .catch((err) => {
        if (cancelled) return
        setDetail(null)
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
          setLoadState('error')
          return
        }
        setLoadError(getApiErrorMessage(err))
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [slugOrId])

  const selectedVariant = useMemo(() => {
    if (!detail || selectedVariantId == null) return null
    const list = Array.isArray(detail.variants) ? detail.variants : []
    return list.find((v) => v?.id === selectedVariantId) ?? null
  }, [detail, selectedVariantId])

  const gallery = useMemo(
    () => (detail ? buildGalleryFromDetail(detail) : null),
    [detail]
  )

  const variantsForUi = useMemo(
    () => (detail ? mapVariantsForUi(detail) : []),
    [detail]
  )

  const pricing = useMemo(
    () => resolveDetailPricing(detail ?? {}, selectedVariant),
    [detail, selectedVariant]
  )

  const specs = useMemo(
    () =>
      detail
        ? buildTechnicalSpecsFromDetail(detail, selectedVariant)
        : [],
    [detail, selectedVariant]
  )

  const highlights = useMemo(
    () => (detail ? buildHighlightsFromDetail(detail) : []),
    [detail]
  )

  const categoryPath = useMemo(() => {
    const cid = detail?.categoryId
    if (typeof cid !== 'number' || !categoryTree?.length) return null
    return findCategoryPathById(categoryTree, cid)
  }, [detail, categoryTree])

  const breadcrumbs = useMemo(() => {
    const items = [
      { label: 'Trang chủ', href: '/' },
      { label: 'Sản phẩm', href: '/products' },
    ]
    if (categoryPath?.length) {
      categoryPath.forEach((node) => {
        items.push({
          label: node.name,
          href: `/products?categoryId=${node.id}`,
        })
      })
    } else if (detail?.categoryName) {
      items.push({
        label: String(detail.categoryName),
        href:
          typeof detail.categoryId === 'number'
            ? `/products?categoryId=${detail.categoryId}`
            : '/products',
      })
    }
    if (detail?.name) {
      items.push({ label: String(detail.name), href: null })
    }
    return items
  }, [categoryPath, detail])

  const handleVariantChange = useCallback((nextId) => {
    setSelectedVariantId(nextId)
  }, [])

  const executeAddSelectionToCart = useCallback(async () => {
    if (!accessToken) {
      navigate('/login', {
        state: { from: `${location.pathname}${location.search}` },
      })
      return { outcome: /** @type {const} */ ('login') }
    }
    if (selectedVariantId == null || typeof selectedVariantId !== 'number') {
      return {
        outcome: /** @type {const} */ ('error'),
        message: 'Sản phẩm chưa có biến thể để thêm vào giỏ.',
      }
    }
    const { message, data } = await storeAddCartItem(accessToken, {
      variantId: selectedVariantId,
      quantity: 1,
    })
    if (data && typeof data === 'object') {
      applyCartDto(data)
    }
    const line = data?.lines?.find((l) => l.variantId === selectedVariantId)
    let snackText = message
    if (line?.insufficientStock) {
      snackText +=
        ' Lưu ý: số lượng trong giỏ có thể vượt tồn kho.'
    }
    return {
      outcome: /** @type {const} */ ('ok'),
      snackText,
    }
  }, [
    accessToken,
    applyCartDto,
    location.pathname,
    location.search,
    navigate,
    selectedVariantId,
  ])

  const handleAddToCart = useCallback(async () => {
    setAddToCartError('')
    setCartSnackMessage('')
    setCartAction('add')
    try {
      const r = await executeAddSelectionToCart()
      if (r.outcome === 'login') return
      if (r.outcome === 'error') {
        setAddToCartError(r.message)
        return
      }
      setCartSnackMessage(r.snackText)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login', {
          state: { from: `${location.pathname}${location.search}` },
        })
        return
      }
      setAddToCartError(getApiErrorMessage(err))
    } finally {
      setCartAction(null)
    }
  }, [
    executeAddSelectionToCart,
    location.pathname,
    location.search,
    navigate,
  ])

  const handleBuyNow = useCallback(async () => {
    setAddToCartError('')
    setCartSnackMessage('')
    setCartAction('buyNow')
    let skipClearBusy = false
    try {
      const r = await executeAddSelectionToCart()
      if (r.outcome === 'login') return
      if (r.outcome === 'error') {
        setAddToCartError(r.message)
        return
      }
      skipClearBusy = true
      setCartAction(null)
      navigate('/cart')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login', {
          state: { from: `${location.pathname}${location.search}` },
        })
        return
      }
      setAddToCartError(getApiErrorMessage(err))
    } finally {
      if (!skipClearBusy) setCartAction(null)
    }
  }, [
    executeAddSelectionToCart,
    location.pathname,
    location.search,
    navigate,
  ])

  const inStock = variantLooksInStock(selectedVariant)
  const addToCartDisabled =
    variantsForUi.length === 0 ||
    selectedVariantId == null ||
    typeof selectedVariantId !== 'number'

  const productNumericId =
    detail && typeof detail.id === 'number' ? detail.id : null

  const inCompare =
    productNumericId != null && isCompared(productNumericId)
  const compareCheckboxDisabled =
    productNumericId != null &&
    !inCompare &&
    compareItems.length >= MAX_COMPARE

  const handleCompareToggle = useCallback(
    /** @type {(checked: boolean) => void} */ (checked) => {
      if (productNumericId == null || !detail) return
      const slugVal =
        typeof detail.slug === 'string' && detail.slug.trim()
          ? detail.slug.trim()
          : null
      toggleCompared(
        {
          id: productNumericId,
          slug: slugVal,
          name:
            typeof detail.name === 'string' && detail.name.trim()
              ? detail.name.trim()
              : 'Sản phẩm',
          image:
            gallery?.mainImage && String(gallery.mainImage).trim()
              ? String(gallery.mainImage).trim()
              : '',
        },
        checked
      )
    },
    [
      detail,
      gallery?.mainImage,
      productNumericId,
      toggleCompared,
    ]
  )

  if (loadState === 'loading') {
    return (
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-6 pb-20">
        <p className="py-16 text-center text-slate-500 dark:text-slate-400">
          Đang tải sản phẩm…
        </p>
      </main>
    )
  }

  if (loadState === 'error') {
    return (
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-6 pb-20">
        <div className="py-16 text-center space-y-4">
          <p className="text-slate-600 dark:text-slate-400" role="alert">
            {notFound
              ? 'Không tìm thấy sản phẩm.'
              : loadError || 'Không tải được sản phẩm.'}
          </p>
          <Link
            to="/products"
            className="inline-block text-primary font-bold hover:underline"
          >
            ← Quay lại danh sách sản phẩm
          </Link>
        </div>
      </main>
    )
  }

  if (!detail || !gallery) {
    return (
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-6 pb-20">
        <div className="py-16 text-center space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Không có dữ liệu sản phẩm.
          </p>
          <Link
            to="/products"
            className="inline-block text-primary font-bold hover:underline"
          >
            ← Quay lại danh sách sản phẩm
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
    <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-6 pb-28">
      <Breadcrumbs items={breadcrumbs} />
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductGallery
            key={detail.id}
            mainImage={gallery.mainImage}
            mainImageAlt={gallery.mainImageAlt}
            thumbnails={gallery.thumbnails}
            moreThumbsCount={gallery.moreThumbsCount}
          />
          <div className="flex flex-col gap-3 min-h-0">
            {productNumericId != null ? (
              <section
                className={[
                  'max-w-xl rounded-xl border-2 px-4 py-3.5 shadow-sm transition-colors',
                  inCompare
                    ? 'border-primary bg-primary/[0.08] ring-2 ring-primary/15 dark:bg-primary/[0.12]'
                    : 'border-slate-200 bg-gradient-to-br from-white to-slate-50 dark:border-slate-600 dark:from-slate-900 dark:to-slate-900/70',
                  compareCheckboxDisabled ? 'opacity-75' : '',
                ].join(' ')}
                aria-labelledby="pdp-compare-heading"
              >
                <label
                  className={
                    compareCheckboxDisabled
                      ? 'flex cursor-not-allowed gap-3'
                      : 'flex cursor-pointer gap-3'
                  }
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25 dark:bg-primary/25">
                    <Icon name="compare_arrows" className="text-[22px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      id="pdp-compare-heading"
                      className="text-[11px] font-bold uppercase tracking-wider text-primary"
                    >
                      So sánh sản phẩm
                    </span>
                    <span className="flex flex-wrap items-center gap-2 leading-snug font-semibold text-slate-900 dark:text-slate-100">
                      <span className="inline-flex shrink-0 items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
                          checked={Boolean(inCompare)}
                          disabled={Boolean(compareCheckboxDisabled)}
                          onChange={(e) =>
                            handleCompareToggle(e.target.checked)
                          }
                        />
                        <span>
                          {inCompare
                            ? 'Đã thêm vào danh sách'
                            : 'Thêm vào danh sách so sánh'}
                        </span>
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-200/90 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {compareItems.length}/{MAX_COMPARE}
                      </span>
                    </span>
                  </span>
                </label>
              </section>
            ) : null}
            <ProductInfo
              name={detail.name}
              rating={0}
              reviewCount={0}
              inStock={inStock}
              price={pricing.price}
              originalPrice={pricing.originalPrice}
              discountPercent={pricing.discountPercent}
              highlights={highlights}
              variants={variantsForUi}
              selectedVariantId={selectedVariantId}
              onVariantChange={handleVariantChange}
              storeServicesItems={DEFAULT_SERVICES}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddToCart}
              addToCartDisabled={addToCartDisabled}
              cartAction={cartAction}
              addToCartError={addToCartError}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-start">
        {detail.description ? (
          <section className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm min-w-0">
            <h2 className="text-base font-bold mb-2 text-slate-900 dark:text-slate-100">
              Mô tả sản phẩm
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[min(52vh,26rem)] overflow-y-auto pr-1">
              {detail.description}
            </div>
          </section>
        ) : (
          <div
            className="hidden lg:block lg:col-span-8"
            aria-hidden="true"
          />
        )}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          <TechnicalSpecs items={specs} />
        </div>
      </div>
      <ComboPromo items={[]} />
    </main>
    <CartSuccessSnackbar
      message={cartSnackMessage}
      onDismiss={() => setCartSnackMessage('')}
    />
    </>
  )
}
