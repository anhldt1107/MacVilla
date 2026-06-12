import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../contexts/AuthContext'
import { ApiError } from '../../api/httpClient'
import { getApiErrorMessage } from '../../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../../lib/auth/mapValidationErrors'
import './registerPartnerForm.css'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../lib/brand'
import { AddressAutocompleteInput } from '../address/AddressAutocompleteInput'

export function RegisterPartnerForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({})
  )

  const { registerB2bAndLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    const next = /** @type {Record<string, string>} */ ({})
    if (!companyName.trim()) next.companyName = 'Vui lòng nhập tên doanh nghiệp.'
    if (!taxCode.trim()) next.taxCode = 'Vui lòng nhập mã số thuế.'
    if (!fullName.trim()) next.fullName = 'Vui lòng nhập người đại diện.'
    if (!phone.trim()) next.phone = 'Vui lòng nhập số điện thoại.'
    if (!email.trim()) next.email = 'Vui lòng nhập email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Email không hợp lệ.'
    }
    if (!companyAddress.trim()) {
      next.companyAddress = 'Vui lòng nhập địa chỉ công ty.'
    }
    if (!password) next.password = 'Vui lòng nhập mật khẩu.'
    else if (password.length < 6) {
      next.password = 'Mật khẩu tối thiểu 6 ký tự.'
    }

    if (!termsAccepted) {
      setFormError('Vui lòng đồng ý điều khoản dịch vụ và chính sách bảo mật.')
    }
    if (Object.keys(next).length > 0) {
      setFieldErrors(next)
      return
    }
    if (!termsAccepted) return

    setSubmitting(true)
    try {
      await registerB2bAndLogin({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        companyName: companyName.trim(),
        taxCode: taxCode.trim(),
        companyAddress: companyAddress.trim(),
      })
      navigate('/partner/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setFormError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rpb-form-column custom-scrollbar">
      <div className="rpb-form-inner">
        <Link to="/" className="rpb-mobile-logo">
          <img
            src={BRAND_LOGO_SRC}
            alt=""
            className="rpb-mobile-logo-img max-h-10 w-auto object-contain"
          />
        </Link>

        <div className="rpb-form-title-block">
          <h2 className="rpb-form-h2">Đăng ký Đối tác</h2>
          <p className="rpb-form-sub">
            Điền đầy đủ thông tin để tạo tài khoản khách hàng doanh nghiệp (B2B).
          </p>
        </div>

        {formError ? <div className="rpb-form-alert">{formError}</div> : null}

        <form className="rpb-form-grid" onSubmit={handleSubmit} noValidate>
          <div className="rpb-form-field md:col-span-2">
            <label className="rpb-form-label" htmlFor="rpb-company">
              Tên doanh nghiệp <span className="rpb-form-required">*</span>
            </label>
            <div className="rpb-form-input-wrap">
              <Icon name="apartment" className="rpb-form-icon" />
              <input
                id="rpb-company"
                type="text"
                autoComplete="organization"
                placeholder="Công ty CP Xây dựng ABC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={`rpb-form-input ${fieldErrors.companyName ? 'is-invalid' : ''}`}
              />
            </div>
            {fieldErrors.companyName ? (
              <p className="rpb-form-field-error">{fieldErrors.companyName}</p>
            ) : null}
          </div>

          <div className="rpb-form-field">
            <label className="rpb-form-label" htmlFor="rpb-tax">
              Mã số thuế <span className="rpb-form-required">*</span>
            </label>
            <div className="rpb-form-input-wrap">
              <Icon name="badge" className="rpb-form-icon" />
              <input
                id="rpb-tax"
                type="text"
                autoComplete="off"
                placeholder="0101234567"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className={`rpb-form-input ${fieldErrors.taxCode ? 'is-invalid' : ''}`}
              />
            </div>
            {fieldErrors.taxCode ? (
              <p className="rpb-form-field-error">{fieldErrors.taxCode}</p>
            ) : null}
          </div>

          <div className="rpb-form-field">
            <label className="rpb-form-label" htmlFor="rpb-rep">
              Người đại diện <span className="rpb-form-required">*</span>
            </label>
            <div className="rpb-form-input-wrap">
              <Icon name="person" className="rpb-form-icon" />
              <input
                id="rpb-rep"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`rpb-form-input ${fieldErrors.fullName ? 'is-invalid' : ''}`}
              />
            </div>
            {fieldErrors.fullName ? (
              <p className="rpb-form-field-error">{fieldErrors.fullName}</p>
            ) : null}
          </div>

          <div className="rpb-form-field">
            <label className="rpb-form-label" htmlFor="rpb-phone">
              Số điện thoại <span className="rpb-form-required">*</span>
            </label>
            <div className="rpb-form-input-wrap">
              <Icon name="call" className="rpb-form-icon" />
              <input
                id="rpb-phone"
                type="tel"
                autoComplete="tel"
                placeholder="0901 234 567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`rpb-form-input ${fieldErrors.phone ? 'is-invalid' : ''}`}
              />
            </div>
            {fieldErrors.phone ? (
              <p className="rpb-form-field-error">{fieldErrors.phone}</p>
            ) : null}
          </div>

          <div className="rpb-form-field">
            <label className="rpb-form-label" htmlFor="rpb-email">
              Email công ty <span className="rpb-form-required">*</span>
            </label>
            <div className="rpb-form-input-wrap">
              <Icon name="mail" className="rpb-form-icon" />
              <input
                id="rpb-email"
                type="email"
                autoComplete="email"
                placeholder="contact@company.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`rpb-form-input ${fieldErrors.email ? 'is-invalid' : ''}`}
              />
            </div>
            {fieldErrors.email ? (
              <p className="rpb-form-field-error">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="rpb-form-field md:col-span-2">
            <label className="rpb-form-label" htmlFor="rpb-address">
              Địa chỉ công ty <span className="rpb-form-required">*</span>
            </label>
            <AddressAutocompleteInput
              id="rpb-address"
              rows={2}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
              value={companyAddress}
              onChange={setCompanyAddress}
              className={`rpb-form-textarea ${fieldErrors.companyAddress ? 'is-invalid' : ''}`}
            />
            {fieldErrors.companyAddress ? (
              <p className="rpb-form-field-error">{fieldErrors.companyAddress}</p>
            ) : null}
          </div>

          <div className="rpb-form-field md:col-span-2">
            <label className="rpb-form-label" htmlFor="rpb-password">
              Mật khẩu <span className="rpb-form-required">*</span>
            </label>
            <div className="rpb-form-input-wrap">
              <Icon name="lock" className="rpb-form-icon" />
              <input
                id="rpb-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`rpb-form-input-password ${fieldErrors.password ? 'is-invalid' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rpb-form-toggle-password"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-lg" />
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="rpb-form-field-error">{fieldErrors.password}</p>
            ) : (
              <p className="rpb-form-hint">Tối thiểu 6 ký tự (theo chính sách hệ thống).</p>
            )}
          </div>

          <div className="rpb-form-terms">
            <input
              id="terms-partner"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="rpb-form-terms-check"
            />
            <label htmlFor="terms-partner" className="rpb-form-terms-label">
              Tôi đồng ý với các{' '}
              <a href="#" className="rpb-form-footer-link">
                Điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="#" className="rpb-form-footer-link">
                Chính sách bảo mật
              </a>{' '}
              dành cho đối tác của {BRAND_NAME}.
            </label>
          </div>

          <div className="rpb-form-actions">
            <button type="submit" className="rpb-form-submit" disabled={submitting}>
              <span>{submitting ? 'Đang đăng ký…' : 'Hoàn tất đăng ký B2B'}</span>
              {!submitting ? <Icon name="arrow_forward" /> : null}
            </button>
          </div>

          <div className="rpb-form-footer">
            <p className="rpb-form-footer-text">
              Đã có tài khoản đối tác?{' '}
              <Link to="/login" className="rpb-form-footer-link">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
