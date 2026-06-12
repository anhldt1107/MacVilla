import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../lib/auth/mapValidationErrors'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../lib/brand'

const REGISTER_HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCSIqbGesgtDQfGxltUnWreISY-YSJNwRFDGAen8rA0z404Jc6OT8xCQOM7c_JSKVCYdPiBKK6r4Jcqhozj0dBqjTN5X6hHDAtTJIvJYkPNFKpBG58sf71kCgyh03f6jSa6QV_BgQdJlLf1IG4BNMZA0ovzP0fLtc0pIrpSlJoaKuW2VyeNOWdT4wQmrgJMMLVG9XCNWLTBCtKEyp2OIk2jxDylGKcOycHISqLUCOWjx7B_5OdM86C5GxUyyF-xcpOc8AD9e--DHcsW'

const GOOGLE_ICON =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDoMOiMlqqysWphmahfENUViNtq2h0VEaN8XhFg7ajamLDPXasaYcgnhoUNp4mNpEk0EQ4_xOGxaxSGWJ2LCUvTBHmZSBpHZUPPYqKh2bB4UxMJJPU68E4Ak4foAOWIg9QuWCm4yVI7iSZkmdb_IndCUeo3s3pYf2_Zw-XL2mN3Z7YIOw8jIEIU8UDDgp7PkDr5QSIVAx0j3hmSNvoEfBYQQV8UU-253qYCRZTmvg803RZl7VJNAdZSv6hcUDXkRZbLzZOhwrqufLtI'
const FACEBOOK_ICON =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB3Y3YKoJIpwd5LfKt7GBHcALZgHU82KCUBepDjmzgkhbQOs1-9MfNFOy38TABET3QB7bua1NsPcfWBeeIvwbbhD2sTY_XB4wMDRmvIuQKhQg3XOAl3C5M06i44hwbEFeZmPkGfgUkYWmb9pHQqh-4LPhn-r-8eXxaLlCI-Y0WDA9qid2X0iWcuK94XU1XjTuP86-DSrr5qqdGH6nrqeuFsFWyWcBXmoKMtJxuBO0PPSZpOFwlxPN_aim5hXWWCLXGbFkk-__eMdWR5'

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({})
  )
  const { registerAndLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    const next = /** @type {Record<string, string>} */ ({})
    if (!fullName.trim()) next.fullName = 'Vui lòng nhập họ và tên.'
    if (!email.trim()) next.email = 'Vui lòng nhập email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Email không hợp lệ.'
    }
    if (!phone.trim()) next.phone = 'Vui lòng nhập số điện thoại.'
    if (!password) next.password = 'Vui lòng nhập mật khẩu.'
    else if (password.length < 6) {
      next.password = 'Mật khẩu tối thiểu 6 ký tự.'
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Mật khẩu xác nhận không khớp.'
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
      await registerAndLogin({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      })
      navigate('/', { replace: true })
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
    <div className="flex min-h-screen flex-col lg:flex-row bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Left: Hero - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${REGISTER_HERO_IMAGE}")` }}
          role="img"
          aria-label="Phòng tắm sang trọng với đá cẩm thạch và thiết bị vàng"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-20 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-lg bg-white p-2 shadow-md">
              <img
                src={BRAND_LOGO_SRC}
                alt=""
                className="h-10 w-auto max-w-[200px] object-contain"
              />
            </div>
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6">
            Nâng tầm không gian sống đẳng cấp
          </h1>
          <p className="text-xl text-slate-100 max-w-lg">
            Gia nhập cộng đồng {BRAND_NAME} để sở hữu những giải pháp thiết bị
            phòng tắm và nhà bếp tinh tế nhất.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-3 mb-10"
          >
            <img
              src={BRAND_LOGO_SRC}
              alt={BRAND_NAME}
              className="h-9 w-auto max-w-[170px] object-contain"
            />
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Tạo tài khoản mới
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Khám phá thế giới nội thất cao cấp ngay hôm nay.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <Icon
                  name="person"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
                />
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
              {fieldErrors.fullName ? (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.fullName}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
                  />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="email@macvilla.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100"
                  />
                </div>
                {fieldErrors.email ? (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Icon
                    name="call"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
                  />
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="09xx xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100"
                  />
                </div>
                {fieldErrors.phone ? (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Icon
                  name="lock"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Icon
                  name="shield_lock"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
              {fieldErrors.confirmPassword ? (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="terms"
                className="text-sm text-slate-600 dark:text-slate-400"
              >
                Tôi đồng ý với{' '}
                <a
                  href="#"
                  className="text-primary font-semibold hover:underline"
                >
                  Điều khoản dịch vụ
                </a>{' '}
                và{' '}
                <a
                  href="#"
                  className="text-primary font-semibold hover:underline"
                >
                  Chính sách bảo mật
                </a>{' '}
                của {BRAND_NAME}.
              </label>
            </div>

            {formError ? (
              <p
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-60 disabled:pointer-events-none transition-all shadow-lg shadow-primary/20"
            >
              {submitting ? 'Đang xử lý…' : 'ĐĂNG KÝ NGAY'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background-light dark:bg-background-dark px-4 text-slate-500">
                Hoặc đăng ký bằng
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              <img src={GOOGLE_ICON} alt="Google" className="size-5" />
              <span className="text-sm font-semibold">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              <img src={FACEBOOK_ICON} alt="Facebook" className="size-5" />
              <span className="text-sm font-semibold">Facebook</span>
            </button>
          </div>

          <p className="mt-10 text-center text-slate-600 dark:text-slate-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>

          <footer className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-8">
            <a href="#" className="hover:text-primary transition-colors">
              Điều khoản
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Bảo mật
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Hỗ trợ
            </a>
            <span>© 2026 {BRAND_NAME}</span>
          </footer>
        </div>
      </div>
    </div>
  )
}
