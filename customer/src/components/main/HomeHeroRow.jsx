import { useEffect, useRef, useState } from 'react'
import { SidebarNav } from './SidebarNav'
import { HeroBanner } from './HeroBanner'
import { SubBanners } from './SubBanners'

/**
 * Hàng hero landing: danh mục trái cao bằng khối banner phải (lg+).
 */
export function HomeHeroRow() {
  const heroStackRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const [heroStackHeight, setHeroStackHeight] = useState(/** @type {number | null} */ (null))

  useEffect(() => {
    const el = heroStackRef.current
    if (!el) return

    const sync = () => {
      setHeroStackHeight(Math.ceil(el.getBoundingClientRect().height))
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    window.addEventListener('resize', sync)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-visible">
      <div
        className="lg:col-span-3 overflow-visible relative z-30 min-w-0 hidden lg:block"
        style={heroStackHeight != null ? { height: heroStackHeight } : undefined}
      >
        <SidebarNav compact className="h-full" stackHeight={heroStackHeight} />
      </div>
      <div ref={heroStackRef} className="lg:col-span-9 min-w-0">
        <HeroBanner />
        <SubBanners />
      </div>
    </div>
  )
}
