import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Shell route cho `/account/*`: một thẻ main + guard B2C.
 * Redirect B2B: `/account/addresses` → partner địa chỉ công ty; còn lại → dashboard đối tác.
 */
export function RetailAccountLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const path =
    location.pathname.replace(/\/+$/, '') ||
    '/'

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.customerType === 'B2B') {
    if (path === '/account/addresses') {
      return <Navigate to="/partner/company/addresses" replace />
    }
    return <Navigate to="/partner/dashboard" replace />
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Outlet />
    </main>
  )
}
