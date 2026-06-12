import { SUB_BANNERS } from '../../../data/hero'

export function SubBanners() {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {SUB_BANNERS.map((banner) => (
        <div
          key={banner.id}
          className="h-24 md:h-32 rounded-lg overflow-hidden relative shadow-sm"
        >
          <img
            src={banner.image}
            alt={banner.imageAlt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold text-center p-2 text-xs md:text-base">
            {banner.title.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
