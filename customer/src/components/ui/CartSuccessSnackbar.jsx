import { Link } from 'react-router-dom'

/**
 * Snackbar góc phải dưới — thông báo thêm giỏ thành công.
 * @param {{ message: string, onDismiss: () => void }} props
 */
export function CartSuccessSnackbar({ message, onDismiss }) {
  if (!message) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4 pr-12 shadow-lg dark:border-green-900/40 dark:bg-green-950/90 sm:bottom-6 sm:right-6"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Đóng"
      >
        <span className="text-lg leading-none" aria-hidden="true">
          ×
        </span>
      </button>
      <p className="text-sm text-green-950 dark:text-green-50 leading-snug pr-1">
        {message}
      </p>
      <Link
        to="/cart"
        className="text-sm font-bold text-primary hover:underline self-start"
        onClick={onDismiss}
      >
        Xem giỏ hàng
      </Link>
    </div>
  )
}
