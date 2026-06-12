import { useState } from 'react'

/**
 * Main image + thumbnail strip (selected state, optional +N more)
 */
export function ProductGallery({
  mainImage,
  mainImageAlt,
  thumbnails = [],
  moreThumbsCount = 0,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const mainSrc = selectedIndex === 0 ? mainImage : thumbnails[selectedIndex - 1]?.src ?? mainImage
  const mainAlt = selectedIndex === 0 ? mainImageAlt : thumbnails[selectedIndex - 1]?.alt ?? mainImageAlt

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center p-8">
        <img
          src={mainSrc}
          alt={mainAlt}
          className="max-w-full h-auto object-contain"
        />
      </div>
      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => setSelectedIndex(0)}
          className={`aspect-square rounded-lg p-1 bg-white dark:bg-slate-800 overflow-hidden ${
            selectedIndex === 0
              ? 'border-2 border-primary'
              : 'border border-slate-200 dark:border-slate-700 hover:border-primary cursor-pointer'
          }`}
        >
          <img
            src={mainImage}
            alt={mainImageAlt}
            className="w-full h-full object-cover"
          />
        </button>
        {thumbnails.slice(0, 3).map((thumb, i) => (
          <button
            key={`${thumb.src}-${i}`}
            type="button"
            onClick={() => setSelectedIndex(i + 1)}
            className={`aspect-square rounded-lg p-1 bg-white dark:bg-slate-800 overflow-hidden ${
              selectedIndex === i + 1
                ? 'border-2 border-primary'
                : 'border border-slate-200 dark:border-slate-700 hover:border-primary cursor-pointer'
            }`}
          >
            <img
              src={thumb.src}
              alt={thumb.alt}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        {moreThumbsCount > 0 && (
          <div className="aspect-square border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-800 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-500">
              +{moreThumbsCount}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
