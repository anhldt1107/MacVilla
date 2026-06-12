import { ProductListingCard } from '../ProductListingCard'

export function ProductGrid({
  products,
  compareIds = new Set(),
  onCompareChange,
  /** @type {(productId: number) => boolean | undefined} */
  compareAddBlocked,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
          compareChecked={compareIds.has(product.id)}
          compareDisabled={compareAddBlocked?.(product.id) ?? false}
          onCompareChange={(checked) =>
            onCompareChange?.(product.id, checked)
          }
        />
      ))}
    </div>
  )
}
