import { Icon } from '../../ui/Icon'
import { ProductCard } from './ProductCard'
import { Countdown } from './Countdown'
import { HOT_SALE_PRODUCTS } from '../../../data/products'

export function HotSaleSection() {
  return (
    <section className="mt-12 bg-secondary rounded-2xl p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Icon
            name="bolt"
            className="text-white text-4xl animate-pulse"
          />
          <h2 className="text-white text-2xl font-black uppercase tracking-tighter italic">
            Hot Sale Cuối Tuần
          </h2>
          <Countdown />
        </div>
        <a
          className="text-white text-sm font-bold flex items-center gap-1 hover:underline"
          href="#"
        >
          Xem tất cả{' '}
          <Icon name="arrow_forward" className="text-sm" />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {HOT_SALE_PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            image={product.image}
            alt={product.alt}
            price={product.price}
            originalPrice={product.originalPrice}
            discount={product.discount}
            badge={product.badge}
            hideOnMobile={product.hideOnMobile}
          />
        ))}
      </div>
    </section>
  )
}
