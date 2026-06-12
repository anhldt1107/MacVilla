import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../api/httpClient'
import { getApiErrorMessage } from '../lib/errors/apiErrorMessage'
import { mapValidationErrorsToFirstMessage } from '../lib/auth/mapValidationErrors'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../lib/brand'

const LOGIN_HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC1J_AbbVfaFhwUw5MNMw6BjVajUAFE8fir3ijg3Rk_cmXO6Fsjurm4Q-EOLC3ZePj6AKKW3UQviPcmnE2ehui6JiIdVvgAp2pgBW5I3tmAQvsr2afqYOWFBuKDuwQe1XnagATnf4Tx4Ue8ULCAIndDFeCzY3tJKHGZ6-ABVO9ur-B3ndyWJjaZYdIYrgTbJEWI0rILF-Ec-Uj_yUlk-XGR1qJLX_rFv7zALFUbPAYSQSTuf5HKGh42zQZKIIeI0zzcurOj0yhA15WN'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [accountKind, setAccountKind] = useState(
    /** @type {'b2c' | 'b2b'} */ ('b2c')
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(
    /** @type {Record<string, string>} */ ({})
  )
  const {
    loginWithPassword,
    loginB2bWithPassword,
    loginWithGoogleB2c,
    loginWithGoogleB2b,
  } = useAuth()
  const navigate = useNavigate()

  const setKind = (/** @type {'b2c' | 'b2b'} */ kind) => {
    setAccountKind(kind)
    setFormError('')
    setFieldErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})
    const emailTrim = email.trim()
    if (!emailTrim) {
      setFieldErrors({ email: 'Vui lòng nhập email.' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setFieldErrors({ email: 'Email không hợp lệ.' })
      return
    }
    if (!password) {
      setFieldErrors({ password: 'Vui lòng nhập mật khẩu.' })
      return
    }
    setSubmitting(true)
    try {
      if (accountKind === 'b2b') {
        await loginB2bWithPassword(emailTrim, password)
        navigate('/partner/dashboard', { replace: true })
      } else {
        await loginWithPassword(emailTrim, password)
        navigate('/', { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setFormError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleContinue = async () => {
    setFormError('')
    setFieldErrors({})
    setGoogleSubmitting(true)
    try {
      if (accountKind === 'b2b') {
        await loginWithGoogleB2b()
        navigate('/partner/dashboard', { replace: true })
      } else {
        await loginWithGoogleB2c()
        navigate('/', { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'VALIDATION_ERROR') {
        setFieldErrors(mapValidationErrorsToFirstMessage(err.errors))
      }
      setFormError(getApiErrorMessage(err))
    } finally {
      setGoogleSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-20 py-4 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={BRAND_LOGO_SRC}
            alt={BRAND_NAME}
            className="h-10 w-auto max-w-[180px] object-contain"
          />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-slate-600 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className="text-slate-600 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            >
              Sản phẩm
            </Link>
            <a
              href="#"
              className="text-slate-600 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            >
              Dự án
            </a>
            <a
              href="#"
              className="text-slate-600 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            >
              Liên hệ
            </a>
          </nav>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <Link
            to="/register"
            className="flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md"
          >
            Đăng ký ngay
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] md:min-h-[700px]">
          {/* Left: Form */}
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-primary text-3xl md:text-4xl font-black leading-tight mb-3">
                Chào mừng bạn trở lại
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base">
                {accountKind === 'b2b'
                  ? 'Đăng nhập cổng đối tác để quản lý đơn hàng B2B, báo giá và công trình.'
                  : 'Đăng nhập để quản lý đơn hàng và khám phá bộ sưu tập thiết bị cao cấp nhất.'}
              </p>
            </div>

            <div
              className="mb-8 flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-800/80"
              role="tablist"
              aria-label="Loại tài khoản đăng nhập"
            >
              <button
                type="button"
                role="tab"
                aria-selected={accountKind === 'b2c'}
                onClick={() => setKind('b2c')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                  accountKind === 'b2c'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Khách hàng cá nhân
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accountKind === 'b2b'}
                onClick={() => setKind('b2b')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                  accountKind === 'b2b'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Doanh nghiệp
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 ml-1">
                  {accountKind === 'b2b' ? 'Email doanh nghiệp' : 'Email đăng nhập'}
                </label>
                <div className="relative group">
                  <Icon
                    name="mail"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                  />
                </div>
                {fieldErrors.email ? (
                  <p className="text-sm text-red-600 dark:text-red-400 ml-1">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Mật khẩu
                  </label>
                  <a
                    href="#"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative group">
                  <Icon
                    name="lock"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <Icon
                      name={showPassword ? 'visibility_off' : 'visibility'}
                      className="text-[20px]"
                    />
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="text-sm text-red-600 dark:text-red-400 ml-1">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={submitting || googleSubmitting}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:pointer-events-none text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] mt-4"
              >
                {submitting
                  ? 'Đang xử lý…'
                  : accountKind === 'b2b'
                    ? 'ĐĂNG NHẬP DOANH NGHIỆP'
                    : 'ĐĂNG NHẬP'}
              </button>
            </form>
            {formError ? (
              <p
                className="mt-4 text-center text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider">
                <span className="bg-white px-4 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  Hoặc
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {accountKind === 'b2b' ? (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Cần tài khoản đối tác đã đăng ký; Google chỉ đăng nhập hoặc liên
                  kết sau khi đã có tài khoản.
                </p>
              ) : null}
              <button
                type="button"
                disabled={submitting || googleSubmitting}
                onClick={() => void handleGoogleContinue()}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleSubmitting ? 'Đang mở Google…' : 'Tiếp tục với Google'}
              </button>
            </div>

            <div className="mt-10 space-y-2 text-center">
              {accountKind === 'b2c' ? (
                <p className="text-slate-600 dark:text-slate-400">
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/register"
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng ký thành viên mới
                  </Link>
                </p>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  Chưa có tài khoản đối tác?{' '}
                  <Link
                    to="/register/partner"
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng ký doanh nghiệp
                  </Link>
                </p>
              )}
              {accountKind === 'b2c' ? (
                <p className="text-slate-600 dark:text-slate-400">
                  <Link
                    to="/register/partner"
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng ký với tư cách doanh nghiệp
                  </Link>
                </p>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => setKind('b2c')}
                    className="text-primary font-bold hover:underline"
                  >
                    Đăng nhập tài khoản cá nhân
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Right: Hero */}
          <div className="hidden md:block md:w-1/2 relative min-h-[320px]">
            <div className="absolute inset-0 bg-primary/40 mix-blend-multiply z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent z-20" />
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: `url("${LOGIN_HERO_IMAGE}")` }}
              role="img"
              aria-label="Phòng tắm cao cấp với thiết bị hiện đại"
            />
            <div className="absolute bottom-16 left-12 right-12 z-30 text-white">
              <div className="size-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center mb-6">
                <Icon name="verified" className="text-white text-3xl" />
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Chất lượng Hàn Quốc cho ngôi nhà Việt
              </h3>
              <p className="text-slate-100 text-lg opacity-90 font-light leading-relaxed">
                Khám phá hệ sinh thái thiết bị phòng tắm và nhà bếp thông minh,
                hiện đại mang chuẩn mực quốc tế đến không gian sống của bạn.
              </p>
              <div className="mt-8 flex gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black">10K+</span>
                  <span className="text-xs uppercase tracking-widest opacity-70">
                    Khách hàng
                  </span>
                </div>
                <div className="w-px h-10 bg-white/30 self-center" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black">500+</span>
                  <span className="text-xs uppercase tracking-widest opacity-70">
                    Dự án lớn
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 md:px-20 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Macvilla. Tất cả các quyền được bảo lưu.</p>
          <div className="flex gap-6">
            <a
              href="#"
              className="hover:text-primary transition-colors"
            >
              Điều khoản dịch vụ
            </a>
            <a
              href="#"
              className="hover:text-primary transition-colors"
            >
              Chính sách bảo mật
            </a>
            <a
              href="#"
              className="hover:text-primary transition-colors"
            >
              Hỗ trợ khách hàng
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
