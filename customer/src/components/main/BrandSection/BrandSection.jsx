import { BRANDS } from '../../../data/brands'

export function BrandSection() {
  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full" />
        Thương Hiệu Đồng Hành
      </h2>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-60 hover:grayscale-0 transition-all">
        {BRANDS.map((brand) => (
          <div key={brand.name} className="flex flex-col items-center">
            <span className="text-2xl font-black text-slate-800">
              {brand.name}
            </span>
            <span className="text-[8px] uppercase tracking-tighter">
              {brand.tagline}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
