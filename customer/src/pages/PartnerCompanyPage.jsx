import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../lib/auth/mapValidationErrors'
import { AddressAutocompleteInput } from '../components/address/AddressAutocompleteInput'

function formatMoneyVnd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'
}

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-primary'

export function PartnerCompanyPage() {
  const { user, isAuthenticated, updateB2bProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({})
  )

  useEffect(() => {
    if (!user || user.customerType !== 'B2B') return
    setFullName(user.fullName || '')
    setEmail(user.email || '')
    setPhone(user.phone || '')
    setCompanyName(user.companyName || '')
    setTaxCode(user.taxCode || '')
    setCompanyAddress(user.companyAddress || '')
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSuccessMessage('')
    setFieldErrors({})

    const next = /** @type {Record<string, string>} */ ({})
    if (!companyName.trim()) next.companyName = 'Vui lòng nhập tên doanh nghiệp.'
    if (!taxCode.trim()) next.taxCode = 'Vui lòng nhập mã số thuế.'
    if (!fullName.trim()) next.fullName = 'Vui lòng nhập họ tên người đại diện.'
    if (!phone.trim()) next.phone = 'Vui lòng nhập số điện thoại.'
    if (!email.trim()) next.email = 'Vui lòng nhập email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Email không hợp lệ.'
    }
    if (!companyAddress.trim()) {
      next.companyAddress = 'Vui lòng nhập địa chỉ công ty.'
    }
    if (Object.keys(next).length > 0) {
      setFieldErrors(next)
      return
    }

    setSubmitting(true)
    try {
      await updateB2bProfile({
        fullName,
        email,
        phone,
        companyName,
        taxCode,
        companyAddress,
      })
      setSuccessMessage('Cập nhật hồ sơ doanh nghiệp thành công.')
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setFormError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <PartnerPaymentsPageHeader title="Thông tin doanh nghiệp" />
        <section className="p-8 pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <Icon name="login" className="text-lg" />
            Đăng nhập
          </Link>
        </section>
      </>
    )
  }

  if (user?.customerType !== 'B2B') {
    return (
      <>
        <PartnerPaymentsPageHeader title="Thông tin doanh nghiệp" />
        <section className="p-8 pt-2 text-slate-600 dark:text-slate-400 text-sm">
          <p>
            Tài khoản hiện tại không phải B2B. Vui lòng{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              đăng nhập
            </Link>{' '}
            bằng tài khoản doanh nghiệp hoặc{' '}
            <Link
              to="/register/partner"
              className="text-primary font-semibold hover:underline"
            >
              đăng ký đối tác
            </Link>
            .
          </p>
        </section>
      </>
    )
  }

  return (
    <>
      <PartnerPaymentsPageHeader title="Thông tin doanh nghiệp" />

      <section className="p-8 pt-6 max-w-3xl">
        {formError ? (
          <div
            className="mb-6 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
            role="alert"
          >
            {formError}
          </div>
        ) : null}
        {successMessage ? (
          <div
            className="mb-6 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
            role="status"
          >
            {successMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label htmlFor="pc-fullName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Họ và tên người đại diện
              </label>
              <input
                id="pc-fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                autoComplete="name"
              />
              {fieldErrors.fullName ? (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="pc-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="pc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
              {fieldErrors.email ? (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="pc-phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Điện thoại
              </label>
              <input
                id="pc-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                autoComplete="tel"
              />
              {fieldErrors.phone ? (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pc-companyName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tên công ty
              </label>
              <input
                id="pc-companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
                autoComplete="organization"
              />
              {fieldErrors.companyName ? (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.companyName}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="pc-taxCode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mã số thuế
              </label>
              <input
                id="pc-taxCode"
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className={inputClass}
              />
              {fieldErrors.taxCode ? (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.taxCode}</p>
              ) : null}
            </div>
            <div className="flex flex-col justify-end">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Công nợ hiện tại
              </span>
              <p className="text-lg font-bold text-primary py-2">
                {formatMoneyVnd(user?.debtBalance)}
              </p>
              <p className="text-[11px] text-slate-500">Chỉ xem.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pc-address" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Địa chỉ công ty
              </label>
              <AddressAutocompleteInput
                id="pc-address"
                rows={3}
                value={companyAddress}
                onChange={setCompanyAddress}
                className={`${inputClass} resize-y min-h-[88px]`}
                disabled={submitting}
              />
              {fieldErrors.companyAddress ? (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.companyAddress}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}
