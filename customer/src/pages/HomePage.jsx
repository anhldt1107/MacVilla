import { HomeHeroRow } from '../components/main/HomeHeroRow'
import { HomeFeaturedProductsSection } from '../components/main/HomeFeaturedProductsSection'
import { BrandSection } from '../components/main/BrandSection'
import { SmartHomeSection } from '../components/main/SmartHomeSection'

export function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6 overflow-x-visible">
      <HomeHeroRow />
      <HomeFeaturedProductsSection />
      <BrandSection />
      <SmartHomeSection />
    </main>
  )
}
