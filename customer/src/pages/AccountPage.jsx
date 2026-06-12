import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { AccountAccountShell } from '../components/account/AccountAccountShell'
import { PROFILE_AVATAR } from '../data/account'
import { storeMeFetchOrders } from '../api/store/storeMeOrdersApi'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../lib/auth/mapValidationErrors'
import { normalizeOrdersList, pickPayable } from '../lib/orders/customerOrdersList'
import {
  customerOrderStatusLabel,
  customerOrderStatusBadgeClass,
} from '../lib/customerOrderStatus'

const RECENT_ORDERS_PREVIEW = 3

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(value)) + 'đ'
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Bỏ khoảng trắng/dấu phân tách; +84 / 84 → 0 (mobile VN). */
function normalizeVietnamMobilePhone(raw) {
  let t = String(raw ?? '')
    .trim()
    .replace(/[\s.()\-]/g, '')
  if (t.startsWith('+84')) t = '0' + t.slice(3)
  else if (t.startsWith('84') && t.length >= 10) t = '0' + t.slice(2)
  return t
}

/** Di động VN: 0 + đầu 3|5|7|8|9 + 8 chữ số (tối đa 50 ký tự theo BE). */
function retailPhoneLooksValid(raw) {
  const t = normalizeVietnamMobilePhone(raw)
  if (!t || t.length > 50) return false
  return /^0(3|5|7|8|9)[0-9]{8}$/.test(t)
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary'

/**
 * Dialog đổi mật khẩu
 */
function ChangePasswordDialog({ open, onClose }) {
  const { changeRetailPassword, logout } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))

  useEffect(() => {
    if (!open) {
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setFieldErrors({})
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    const next = /** @type {Record<string, string>} */ ({})
    if (!oldPassword) next.oldPassword = 'Nhập mật khẩu hiện tại.'
    if (!newPassword) next.newPassword = 'Nhập mật khẩu mới.'
    else if (newPassword.length < 6) next.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự.'
    else if (newPassword.length > 200) next.newPassword = 'Mật khẩu mới tối đa 200 ký tự.'
    if (newPassword && oldPassword && newPassword === oldPassword) {
      next.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.'
    }
    if (newPassword !== confirmPassword) {
      next.confirmPassword = 'Xác nhận mật khẩu không khớp.'
    }
    if (Object.keys(next).length > 0) {
      setFieldErrors(next)
      return
    }
    setSubmitting(true)
    try {
      await changeRetailPassword({ oldPassword, newPassword })
      onClose()
      logout()
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Đóng"
        disabled={submitting}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwd-dialog-title"
        className="relative z-[1] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6"
      >
        <h3 id="pwd-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Đổi mật khẩu
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Sau khi đổi thành công, bạn sẽ được đăng xuất — vui lòng đăng nhập lại bằng mật khẩu mới.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            {fieldErrors.oldPassword ? (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.oldPassword}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Mật khẩu mới
            </label>
            <input
              type="password"
              autoComplete="new-password"
              maxLength={200}
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {fieldErrors.newPassword ? (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.newPassword}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              autoComplete="new-password"
              maxLength={200}
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {fieldErrors.confirmPassword ? (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AccountPage() {
  const { user, accessToken, updateRetailProfile, logout } = useAuth()

  const [profileFullName, setProfileFullName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileFieldErrors, setProfileFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({})
  )

  const [pwdOpen, setPwdOpen] = useState(false)

  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState('')
  const [recentItems, setRecentItems] = useState(/** @type {unknown[]} */ ([]))

  useEffect(() => {
    if (!accessToken) {
      setRecentLoading(false)
      setRecentError('')
      setRecentItems([])
      return
    }
    let cancelled = false
    setRecentLoading(true)
    setRecentError('')
    storeMeFetchOrders(accessToken, { page: 1, pageSize: RECENT_ORDERS_PREVIEW })
      .then((raw) => {
        if (cancelled) return
        const { items } = normalizeOrdersList(raw)
        setRecentItems(items)
      })
      .catch((err) => {
        if (cancelled) return
        setRecentError(getApiErrorMessage(err))
        setRecentItems([])
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  /**
   * Chỉ đồng bộ form khi đổi tài khoản (mount lần đầu hoặc đổi user.id).
   * Tránh re-sync mỗi khi reference `user` thay đổi do BE refresh nền —
   * nếu không, ký tự đang gõ sẽ bị overwrite gây "refresh" field.
   */
  const lastSyncedUserIdRef = useRef(/** @type {string | number | null} */ (null))
  useEffect(() => {
    if (!user) {
      lastSyncedUserIdRef.current = null
      return
    }
    if (lastSyncedUserIdRef.current === user.id) return
    lastSyncedUserIdRef.current = user.id
    setProfileFullName(user.fullName || user.name || '')
    setProfileEmail(user.email || '')
    setProfilePhone(user.phone || '')
  }, [user])

  // RetailAccountLayout đã chặn !user / B2B; giữ guard tối thiểu cho an toàn kiểu.
  if (!user || user.customerType === 'B2B') return null

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileMessage('')
    setProfileError('')
    setProfileFieldErrors({})
    const next = /** @type {Record<string, string>} */ ({})
    if (!profileFullName.trim()) next.fullName = 'Vui lòng nhập họ tên.'
    const emailFromAccount = String(user.email ?? '').trim()
    if (!emailFromAccount) next.email = 'Tài khoản chưa có email.'

    const phoneRaw = profilePhone.trim()
    if (!phoneRaw) next.phone = 'Vui lòng nhập số điện thoại.'
    else if (!retailPhoneLooksValid(phoneRaw)) {
      next.phone =
        'Số điện thoại không hợp lệ. Dùng 10 số (VD: 0901234567) hoặc +84.'
    }
    if (Object.keys(next).length > 0) {
      setProfileFieldErrors(next)
      return
    }
    setProfileSaving(true)
    try {
      await updateRetailProfile({
        fullName: profileFullName,
        email: emailFromAccount,
        phone: normalizeVietnamMobilePhone(phoneRaw),
      })
      setProfileMessage('Đã lưu thông tin tài khoản.')
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setProfileFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setProfileError(getApiErrorMessage(err))
    } finally {
      setProfileSaving(false)
    }
  }

  const displayName = user.fullName || user.name || 'Khách hàng'

  return (
    <>
      <ChangePasswordDialog open={pwdOpen} onClose={() => setPwdOpen(false)} />

      <AccountAccountShell
        hero={
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20" />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                    <img src={PROFILE_AVATAR} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email || '—'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.phone || '—'}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Khách hàng
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Icon name="manage_accounts" className="text-primary" />
              Thông tin tài khoản
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Cập nhật họ tên và số điện thoại. Email đăng nhập không đổi tại đây.
            </p>
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  maxLength={255}
                  className={inputClass}
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                />
                {profileFieldErrors.fullName ? (
                  <p className="text-xs text-red-600 mt-1">{profileFieldErrors.fullName}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  disabled
                  aria-disabled="true"
                  title="Email đăng nhập không đổi tại đây"
                  className={`${inputClass} bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 cursor-not-allowed disabled:opacity-90`}
                  value={profileEmail}
                />
                {profileFieldErrors.email ? (
                  <p className="text-xs text-red-600 mt-1">{profileFieldErrors.email}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  maxLength={50}
                  autoComplete="tel"
                  className={inputClass}
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
                {profileFieldErrors.phone ? (
                  <p className="text-xs text-red-600 mt-1">{profileFieldErrors.phone}</p>
                ) : null}
              </div>
              {profileError ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {profileError}
                </p>
              ) : null}
              {profileMessage ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                  {profileMessage}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
                >
                  {profileSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={() => setPwdOpen(true)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-800 dark:text-slate-100"
                >
                  Đổi mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-primary hover:underline"
                >
                  Đăng xuất
                </button>
              </div>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="shopping_bag" className="text-primary" />
                Đơn hàng gần đây
              </h3>
              <Link
                to="/account/orders"
                className="text-primary font-semibold text-sm hover:underline"
              >
                Xem tất cả đơn hàng
              </Link>
            </div>
            <div className="space-y-4">
              {recentError ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {recentError}
                </p>
              ) : null}

              {recentLoading
                ? Array.from({ length: RECENT_ORDERS_PREVIEW }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm animate-pulse"
                    >
                      <div className="flex gap-5 items-start">
                        <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                        <div className="flex-1 space-y-3 pt-1">
                          <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-4 w-52 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                          <div className="h-7 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                : null}

              {!recentLoading && !recentError && recentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  <p className="mb-3">Chưa có đơn hàng.</p>
                  <Link to="/products" className="text-primary font-semibold hover:underline">
                    Mua sắm ngay
                  </Link>
                </div>
              ) : null}

              {!recentLoading && recentItems.length > 0
                ? recentItems.map((raw) => {
                    const row = /** @type {Record<string, unknown>} */ (raw)
                    const code =
                      row.orderCode != null ? String(row.orderCode) : String(row.id ?? '')
                    const createdAt =
                      typeof row.createdAt === 'string' ? row.createdAt : undefined
                    const lineCount =
                      typeof row.lineCount === 'number' ? row.lineCount : null
                    const orderStatus =
                      typeof row.orderStatus === 'string' ? row.orderStatus : ''
                    return (
                      <Link
                        key={row.id != null ? String(row.id) : code}
                        to={`/account/orders/${encodeURIComponent(code)}`}
                        className="block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-5 min-w-0">
                            <div
                              aria-hidden
                              className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-primary/30 transition-colors"
                            >
                              <Icon
                                name="inventory_2"
                                className="text-3xl text-slate-400 dark:text-slate-500"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate">
                                Đơn hàng {code}
                              </h4>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-1 text-sm text-slate-500 font-medium flex-wrap gap-1">
                                <span>{formatDateTime(createdAt)}</span>
                                {lineCount != null ? (
                                  <span>· {lineCount} sản phẩm</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 w-full sm:w-auto shrink-0">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${customerOrderStatusBadgeClass(
                                orderStatus
                              )}`}
                            >
                              {customerOrderStatusLabel(orderStatus)}
                            </span>
                            <p className="text-xl font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {formatPrice(pickPayable(row))}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-100 dark:bg-slate-800/40 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center">
              <div>
                <Icon name="add_circle" className="text-4xl text-slate-400 mb-2 mx-auto" />
                <p className="text-slate-500 font-medium">Đăng ký bảo hành sản phẩm mới</p>
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/40 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center">
              <div>
                <Icon name="support_agent" className="text-4xl text-slate-400 mb-2 mx-auto" />
                <p className="text-slate-500 font-medium">Cần hỗ trợ? Chat với chuyên gia</p>
              </div>
            </div>
          </div>
        </div>
      </AccountAccountShell>
    </>
  )
}
