import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { useAuth } from '../../../contexts/AuthContext'
import { useCartCount } from '../../../contexts/CartCountContext'
import { NotificationBell } from '../../notifications/NotificationBell'

function getInitial(name) {
  if (!name || !name.trim()) return '?'
  return name.trim().charAt(0).toUpperCase()
}

export function HeaderActions() {
  const { user, logout, isAuthenticated } = useAuth()
  const { itemCount } = useCartCount()

  return (
    <div className="flex items-center gap-4 text-white">
      {isAuthenticated ? (
        <NotificationBell variant="header" />
      ) : null}
      {isAuthenticated ? (
        <Link
          to="/cart"
          className="flex flex-col items-center relative hover:opacity-90 transition-opacity"
          aria-label={
            itemCount > 0
              ? `Giỏ hàng, ${itemCount} sản phẩm`
              : 'Giỏ hàng'
          }
        >
          <Icon name="shopping_cart" />
          <span className="text-[10px] font-medium">Giỏ hàng</span>
          {itemCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-secondary text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          ) : null}
        </Link>
      ) : null}
      {user ? (
        <div
          className="hidden sm:flex flex-col items-center relative group"
          role="region"
          aria-label="Tài khoản"
        >
          {/* Vùng trigger + dropdown liền nhau (pt-2 bridge) để hover không bị đứt */}
          <div className="flex items-center gap-2 cursor-pointer py-1 pr-1">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-sm font-bold shrink-0">
              {getInitial(user.name)}
            </div>
            <span className="text-[10px] font-medium max-w-[80px] truncate">
              {user.name}
            </span>
          </div>
          <div className="absolute top-full right-0 mt-0 pt-2 w-56 z-50">
            <div className="py-3 px-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto text-left">
              <div className="text-slate-900 dark:text-slate-100 space-y-2">
                <p className="font-semibold text-sm">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-2 space-y-1">
                  <Link
                    to={
                      user.customerType === 'B2B'
                        ? '/partner/dashboard'
                        : '/account'
                    }
                    className="w-full flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg py-2 px-2 -mx-2 transition-colors"
                  >
                    <Icon name="person" className="text-lg" />
                    Thông tin chi tiết
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2 text-sm font-medium text-primary hover:underline py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Icon name="logout" className="text-lg" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Link
          to="/login"
          className="hidden sm:flex flex-col items-center hover:opacity-90 transition-opacity"
          aria-label="Đăng nhập"
        >
          <Icon name="person" />
          <span className="text-[10px] font-medium">Đăng nhập</span>
        </Link>
      )}
    </div>
  )
}
