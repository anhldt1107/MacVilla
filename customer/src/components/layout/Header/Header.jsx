import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { SearchBar, HeaderMobileSearch } from './SearchBar'
import { HeaderActions } from './HeaderActions'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-primary shadow-lg px-4 md:px-10 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" aria-label="Về trang chủ">
          <Logo />
        </Link>
        <SearchBar />
        <HeaderMobileSearch />
        <HeaderActions />
      </div>
    </header>
  )
}
