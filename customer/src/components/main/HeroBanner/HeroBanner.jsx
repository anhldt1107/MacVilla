import { HERO_BANNER } from '../../../data/hero'

export function HeroBanner() {
  const { badge, title, description, cta, image, imageAlt } = HERO_BANNER
  const titleLines = title.split('\n')

  return (
    <div className="relative rounded-xl overflow-hidden aspect-[16/7] md:aspect-[21/9] bg-slate-200 shadow-md">
      <img
        src={image}
        alt={imageAlt}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-8 md:px-16 text-white">
        <span className="bg-secondary text-xs font-bold px-2 py-1 rounded w-fit mb-2">
          {badge}
        </span>
        <h2 className="text-3xl md:text-5xl font-black mb-4">
          {titleLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p className="text-sm md:text-lg mb-6 opacity-90 max-w-md">
          {description}
        </p>
        <button
          type="button"
          className="bg-white text-primary font-bold px-6 py-2.5 rounded-lg w-fit hover:bg-slate-100 transition-colors"
        >
          {cta}
        </button>
      </div>
    </div>
  )
}
