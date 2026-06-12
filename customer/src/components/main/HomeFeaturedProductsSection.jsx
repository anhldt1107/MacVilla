import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { ProductListingCard } from '../products/ProductListingCard'
import { storeFetchProducts } from '../../api/store/storeCatalogApi'
import { mapStoreProductToListingCard } from '../../lib/catalog/mapStoreProductToListingCard'
import { getApiErrorMessage } from '../../lib/errors/apiErrorMessage'

const HOME_PRODUCT_COUNT = 10

/** Khối sản phẩm nổi bật trên trang chủ (trang đầu, số lượng cố định). */
export function HomeFeaturedProductsSection() {
  const [loadState, setLoadState] = useState('loading')
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setLoadState('loading')
      setError('')
    })
    storeFetchProducts({
      page: 1,
      pageSize: HOME_PRODUCT_COUNT,
      includeSubcategories: true,
    })
      .then((data) => {
        if (cancelled) return
        const raw = Array.isArray(data?.items) ? data.items : []
        setProducts(raw.map(mapStoreProductToListingCard))
        setLoadState('success')
      })
      .catch((e) => {
        if (cancelled) return
        setError(getApiErrorMessage(e))
        setProducts([])
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mt-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full shrink-0" aria-hidden />
          Sản phẩm nổi bật
        </h2>
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline shrink-0"
        >
          Xem tất cả
          <Icon name="arrow_forward" className="text-base" />
        </Link>
      </div>

      {loadState === 'loading' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: HOME_PRODUCT_COUNT }, (_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 min-h-[280px] animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {loadState === 'error' ? (
        <p
          className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loadState === 'success' && products.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chưa có sản phẩm để hiển thị.
        </p>
      ) : null}

      {loadState === 'success' && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductListingCard
              key={product.id}
              productId={product.id}
              slug={product.slug}
              name={product.name}
              tag={product.tag}
              image={product.image}
              imageAlt={product.imageAlt}
              price={product.price}
              originalPrice={product.originalPrice ?? undefined}
              badges={product.badges}
              showCompare={false}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
