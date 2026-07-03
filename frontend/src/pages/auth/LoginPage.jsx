import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { setCredentials } from '../../redux/slices/authSlice'
import { authService } from '../../services/authService'
import { roleHome } from '../../utils/roleHome'
import { GoogleLogin } from '@react-oauth/google'
import LotusMascot from '../../components/common/LotusMascot'

const EyeIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1 1 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178a1 1 0 010 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
)
const EyeOffIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.5 10.5 0 001.93 11.68a1 1 0 000 .639C3.42 16.49 7.36 19.5 12 19.5c.99 0 1.95-.14 2.86-.4M6.23 6.23A10.45 10.45 0 0112 4.5c4.64 0 8.58 3.01 9.97 7.18a1 1 0 010 .64 10.5 10.5 0 01-4.29 5.45M6.23 6.23L3 3m3.23 3.23l3.65 3.65m7.89 7.89L21 21m-3.23-3.23l-3.65-3.65m0 0a3 3 0 10-4.24-4.24" /></svg>
)

const LotusLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" opacity="0.85" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" opacity="0.85" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" opacity="0.65" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" opacity="0.65" />
  </svg>
)

const inputCls = 'w-full rounded-sm border border-black/10 bg-white px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/35 focus:border-gold focus:ring-1 focus:ring-gold/40'
const labelCls = 'mb-1.5 block font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/55'
const submitCls = 'mt-2 w-full rounded-sm bg-gold px-6 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover disabled:opacity-60'
const linkCls = 'font-nav text-xs font-semibold text-gold transition-colors hover:text-gold-hover'

const HEADERS = {
  login: { title: 'Đăng Nhập', sub: 'Chào mừng Quý khách quay trở lại' },
  register: { title: 'Đăng Ký', sub: 'Tạo tài khoản nghỉ dưỡng mới' },
  'forgot-password': { title: 'Quên Mật Khẩu', sub: 'Nhập email để nhận mã khôi phục tài khoản' },
  'otp-verify': { title: 'Xác Thực Tài Khoản', sub: 'Vui lòng nhập mã OTP đã được gửi đến email' },
  'otp-reset': { title: 'Đặt Lại Mật Khẩu', sub: 'Vui lòng nhập mã OTP và mật khẩu mới' },
}

const Divider = () => (
  <div className="my-5 flex items-center gap-3 font-nav text-xs text-charcoal/40">
    <span className="h-px flex-1 bg-black/10" /> Hoặc <span className="h-px flex-1 bg-black/10" />
  </div>
)

// Validate dùng chung (khớp BE authService). Trả object lỗi theo field.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/
const PHONE_RE = /^0\d{9,10}$/
const NAME_RE = /^\p{L}+(?:[ ]\p{L}+)*$/u
// Nhà cung cấp phổ biến -> domain đúng (bắt lỗi gõ nhầm gmail.co / gmail.con / gmail.vn ...).
const EMAIL_CANON = {
  gmail: ['gmail.com'], googlemail: ['googlemail.com'], hotmail: ['hotmail.com'],
  icloud: ['icloud.com'], outlook: ['outlook.com', 'outlook.com.vn'], yahoo: ['yahoo.com', 'yahoo.com.vn'],
}
const emailError = (email) => {
  const v = (email || '').trim().toLowerCase()
  if (!v) return 'Vui lòng nhập email'
  if (!EMAIL_RE.test(v)) return 'Email không hợp lệ'
  const domain = v.split('@')[1]
  const brand = domain.split('.')[0]
  if (EMAIL_CANON[brand] && !EMAIL_CANON[brand].includes(domain)) return `Email ${brand} phải là @${EMAIL_CANON[brand][0]}`
  return null
}
const validateRegisterFields = ({ fullName, email, phone, password, confirmPassword }) => {
  const e = {}
  const name = (fullName || '').trim()
  if (!name) e.fullName = 'Vui lòng nhập họ và tên'
  else if (name.length < 2 || name.length > 50 || !NAME_RE.test(name)) e.fullName = 'Họ tên 2–50 ký tự, chỉ gồm chữ và khoảng trắng'
  const em = emailError(email); if (em) e.email = em
  if (!(phone || '').trim()) e.phone = 'Vui lòng nhập số điện thoại'
  else if (!PHONE_RE.test(phone.trim())) e.phone = 'SĐT không hợp lệ (VD: 0901234567)'
  if (!password) e.password = 'Vui lòng nhập mật khẩu'
  else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'Mật khẩu ≥8 ký tự, gồm cả chữ và số'
  if (password !== confirmPassword) e.confirmPassword = 'Mật khẩu xác nhận không khớp'
  return e
}
const validateLoginFields = ({ email, password }) => {
  const e = {}
  const em = emailError(email); if (em) e.email = em
  if (!password) e.password = 'Vui lòng nhập mật khẩu'
  return e
}
const FieldErr = ({ msg }) => (msg ? <p className="mt-1 font-body text-xs text-red-500">{msg}</p> : null)

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const redirectUrl = searchParams.get('redirect') || '/'
  const from = location.state?.from || null
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user) navigate(from || roleHome(user.role) || '/')
  }, [user, navigate])

  // modes: 'login' | 'register' | 'forgot-password' | 'otp-verify' | 'otp-reset'
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const clearFieldErr = (k) => setFieldErrors((p) => (p[k] ? { ...p, [k]: undefined } : p))
  const [resendLeft, setResendLeft] = useState(0) // đếm ngược cooldown gửi lại OTP (giây)

  // Linh vật sen tương tác
  const [focusField, setFocusField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [lookX, setLookX] = useState(0)
  const mascotMode = focusField === 'password' ? (showPassword ? 'peek' : 'cover') : 'idle'
  const lookActive = focusField === 'email'
  const measureRef = useRef(null)
  // Đo vị trí pixel thật của con trỏ (caret) trong ô để mắt nhìn theo
  const eyeFollow = (e) => {
    const el = e.target
    if (!el) return
    const caret = el.selectionStart ?? el.value.length
    const before = el.value.slice(0, caret)
    const cv = measureRef.current || (measureRef.current = document.createElement('canvas'))
    const ctx = cv.getContext('2d')
    const cs = window.getComputedStyle(el)
    ctx.font = `${cs.fontSize} ${cs.fontFamily}`
    const textW = ctx.measureText(before).width
    const contentW = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)
    const ratio = contentW > 0 ? Math.max(0, Math.min(1, textW / contentW)) : 0
    setLookX(ratio * 2 - 1)
  }

  const clearMessages = () => { setError(''); setSuccess('') }

  // Bị đá về đây do khoá tài khoản / chi nhánh -> hiện lý do rõ ràng.
  useEffect(() => {
    const locked = searchParams.get('locked')
    if (locked === 'account') setError('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.')
    else if (locked === 'branch') setError('Chi nhánh của bạn đang tạm ngừng hoạt động. Vui lòng liên hệ quản trị viên.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchMode = (newMode) => {
    setMode(newMode)
    clearMessages()
    setFieldErrors({})
    setPassword('')
    setConfirmPassword('')
    setOtp('')
  }

  const roleRedirect = (u) => {
    navigate(from || roleHome(u.role) || '/')
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    clearMessages()
    try {
      const response = await authService.googleLogin({ credential: credentialResponse.credential })
      const { token, user } = response.data.data
      localStorage.setItem('token', token)
      dispatch(setCredentials({ token, user }))
      setSuccess('Đăng nhập bằng Google thành công!')
      setTimeout(() => roleRedirect(user), 1000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập Google thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => setError('Đăng nhập Google thất bại.')

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = validateLoginFields({ email, password })
    setFieldErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    clearMessages()
    try {
      const response = await authService.login({ email: email.trim(), password })
      const { token, user } = response.data.data
      localStorage.setItem('token', token)
      dispatch(setCredentials({ token, user }))
      setSuccess('Đăng nhập thành công!')
      setTimeout(() => roleRedirect(user), 1000)
    } catch (err) {
      const code = err.response?.data?.code
      const msg = err.response?.data?.message || ''
      // Tài khoản đã đăng ký nhưng chưa xác thực email -> đưa thẳng tới màn nhập OTP + gửi lại mã.
      if (code === 'EMAIL_NOT_VERIFIED' || msg.includes('chưa xác thực')) {
        setError(''); setOtp(''); setMode('otp-verify')
        setSuccess('Tài khoản chưa xác thực email — đã gửi mã OTP tới email của bạn, vui lòng nhập để kích hoạt.')
        try { await doResendOtp(email) } catch (_) { /* còn cooldown thì mã gửi trước đó vẫn dùng được */ }
      } else {
        setError(msg || err.message || 'Đăng nhập thất bại')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validateRegisterFields({ fullName, email, phone, password, confirmPassword })
    setFieldErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    clearMessages()
    try {
      await authService.register({ email: email.trim(), password, fullName: fullName.trim(), phone: phone.trim() })
      setSuccess('Đăng ký thành công! Vui lòng nhập mã OTP đã được gửi đến email của bạn.')
      setTimeout(() => setMode('otp-verify'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  // Đếm ngược cooldown gửi lại OTP
  useEffect(() => {
    if (resendLeft <= 0) return undefined
    const t = setInterval(() => setResendLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendLeft])

  const doResendOtp = async (targetEmail) => {
    await authService.resendOtp({ email: (targetEmail || email).trim() })
    setResendLeft(60)
  }
  const handleResendOtp = async () => {
    if (resendLeft > 0) return
    clearMessages()
    try { await doResendOtp(); setSuccess('Đã gửi lại mã OTP tới email của bạn.') }
    catch (err) { setError(err.response?.data?.message || 'Không gửi lại được mã OTP') }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearMessages()
    try {
      const response = await authService.verifyOtp({ email, otp })
      const { token, user } = response.data.data
      localStorage.setItem('token', token)
      dispatch(setCredentials({ token, user }))
      setSuccess('Xác minh tài khoản thành công!')
      setTimeout(() => navigate('/'), 1000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Xác minh OTP thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearMessages()
    try {
      await authService.forgotPassword({ email })
      setSuccess('Nếu email tồn tại, OTP đặt lại mật khẩu đã được gửi.')
      setTimeout(() => setMode('otp-reset'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Yêu cầu thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setLoading(true)
    clearMessages()
    try {
      await authService.resetPassword({ email, otp, password })
      setSuccess('Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.')
      setTimeout(() => switchMode('login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  const header = HEADERS[mode]

  return (
    <div className="flex min-h-screen bg-off-white">
      {/* ---------- Visual (trái) ---------- */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          alt="Hanoi Hotel"
          className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center text-white">
          <LotusLogo className="h-16 w-16 text-gold-light" />
          <h2 className="mt-6 font-display text-4xl font-semibold tracking-wide">HANOI HOTEL</h2>
          <p className="mt-2 font-nav text-xs uppercase tracking-luxe text-gold-light">Live Oriental Heritage</p>
          <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-white/75">
            Trải nghiệm dịch vụ nghỉ dưỡng cao cấp hòa quyện cùng nét đẹp di sản đặc trưng giữa lòng thủ đô.
          </p>
        </div>
      </div>

      {/* ---------- Form (phải) ---------- */}
      <div className="flex w-full items-center justify-center px-5 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <a href="/" className="inline-flex items-center gap-1.5 font-nav text-xs font-semibold uppercase tracking-wide text-charcoal/55 transition-colors hover:text-gold">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Quay lại trang chủ
          </a>

          {/* Linh vật sen + Header */}
          <div className="mt-4 flex justify-center">
            <LotusMascot mode={mascotMode} lookX={lookX} lookActive={lookActive} />
          </div>
          <div className="mt-1 text-center">
            <h1 className="font-display text-4xl font-medium text-charcoal">{header.title}</h1>
            <p className="mt-2 font-body text-sm text-charcoal/55">
              {mode === 'otp-verify' && email ? `Vui lòng nhập mã OTP đã được gửi đến ${email}` : header.sub}
            </p>
          </div>

          {/* Alerts */}
          {error && <div className="mt-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">{error}</div>}
          {success && <div className="mt-6 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-700">{success}</div>}

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} noValidate className="mt-6 space-y-4">
              <div>
                <label className={labelCls}>Địa chỉ Email *</label>
                <input type="email" placeholder="example@domain.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldErr('email'); eyeFollow(e); }}
                  onKeyUp={eyeFollow} onClick={eyeFollow} onSelect={eyeFollow}
                  onFocus={(e) => { setFocusField('email'); eyeFollow(e); }} onBlur={() => setFocusField(null)}
                  className={`${inputCls} ${fieldErrors.email ? '!border-red-500' : ''}`} />
                <FieldErr msg={fieldErrors.email} />
              </div>
              <div>
                <label className={labelCls}>Mật khẩu *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldErr('password'); }}
                    onFocus={() => setFocusField('password')} onBlur={() => setFocusField(null)}
                    className={`${inputCls} pr-11 ${fieldErrors.password ? '!border-red-500' : ''}`} />
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPassword((s) => !s)} aria-label="Hiện/ẩn mật khẩu"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 transition-colors hover:text-gold">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <FieldErr msg={fieldErrors.password} />
              </div>
              <div className="flex justify-end">
                <button type="button" className={linkCls} onClick={() => switchMode('forgot-password')}>Quên mật khẩu?</button>
              </div>
              <button type="submit" className={submitCls} disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
              <Divider />
              <div className="flex justify-center">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_black" text="signin_with" shape="rectangular" />
              </div>
              <div className="pt-1 text-center font-body text-sm text-charcoal/60">
                Chưa có tài khoản?{' '}
                <button type="button" className={linkCls} onClick={() => switchMode('register')}>Đăng ký ngay</button>
              </div>
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} noValidate className="mt-6 space-y-4">
              <div>
                <label className={labelCls}>Họ và tên *</label>
                <input type="text" placeholder="Nguyễn Văn A" value={fullName}
                  onChange={(e) => { setFullName(e.target.value); clearFieldErr('fullName'); }}
                  className={`${inputCls} ${fieldErrors.fullName ? '!border-red-500' : ''}`} />
                <FieldErr msg={fieldErrors.fullName} />
              </div>
              <div>
                <label className={labelCls}>Địa chỉ Email *</label>
                <input type="email" placeholder="example@domain.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldErr('email'); }}
                  className={`${inputCls} ${fieldErrors.email ? '!border-red-500' : ''}`} />
                <FieldErr msg={fieldErrors.email} />
              </div>
              <div>
                <label className={labelCls}>Số điện thoại *</label>
                <input type="tel" placeholder="0901234567" value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearFieldErr('phone'); }}
                  className={`${inputCls} ${fieldErrors.phone ? '!border-red-500' : ''}`} />
                <FieldErr msg={fieldErrors.phone} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Mật khẩu *</label>
                  <input type="password" placeholder="≥8 ký tự, gồm chữ và số" value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldErr('password'); }}
                    className={`${inputCls} ${fieldErrors.password ? '!border-red-500' : ''}`} />
                  <FieldErr msg={fieldErrors.password} />
                </div>
                <div>
                  <label className={labelCls}>Xác nhận *</label>
                  <input type="password" placeholder="••••••••" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearFieldErr('confirmPassword'); }}
                    className={`${inputCls} ${fieldErrors.confirmPassword ? '!border-red-500' : ''}`} />
                  <FieldErr msg={fieldErrors.confirmPassword} />
                </div>
              </div>
              <button type="submit" className={submitCls} disabled={loading}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</button>
              <Divider />
              <div className="flex justify-center">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_black" text="signup_with" shape="rectangular" />
              </div>
              <div className="pt-1 text-center font-body text-sm text-charcoal/60">
                Đã có tài khoản?{' '}
                <button type="button" className={linkCls} onClick={() => switchMode('login')}>Đăng nhập</button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
              <p className="rounded-sm bg-cream px-4 py-3 font-body text-sm text-charcoal/65">
                Chúng tôi sẽ gửi mã OTP khôi phục mật khẩu đến email của bạn nếu nó tồn tại trên hệ thống.
              </p>
              <div>
                <label className={labelCls}>Địa chỉ Email của bạn *</label>
                <input type="email" placeholder="example@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
              </div>
              <button type="submit" className={submitCls} disabled={loading}>{loading ? 'Đang gửi OTP...' : 'Gửi mã khôi phục'}</button>
              <div className="text-center">
                <button type="button" className={linkCls} onClick={() => switchMode('login')}>← Quay lại Đăng nhập</button>
              </div>
            </form>
          )}

          {/* OTP VERIFY */}
          {mode === 'otp-verify' && (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <label className={labelCls}>Nhập mã OTP gồm 6 chữ số *</label>
                <input type="password" maxLength="6" placeholder="••••••" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required className={`${inputCls} text-center text-2xl tracking-[0.5em]`} />
              </div>
              <button type="submit" className={submitCls} disabled={loading}>{loading ? 'Đang xác thực...' : 'Xác thực OTP'}</button>
              <div className="flex items-center justify-between">
                <button type="button" className={`${linkCls} disabled:opacity-50`} disabled={resendLeft > 0} onClick={handleResendOtp}>
                  {resendLeft > 0 ? `Gửi lại mã sau ${resendLeft}s` : 'Gửi lại mã OTP'}
                </button>
                <button type="button" className={linkCls} onClick={() => switchMode('login')}>← Quay lại Đăng nhập</button>
              </div>
            </form>
          )}

          {/* OTP RESET */}
          {mode === 'otp-reset' && (
            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <div>
                <label className={labelCls}>Nhập mã OTP gồm 6 chữ số *</label>
                <input type="password" maxLength="6" placeholder="••••••" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required className={`${inputCls} text-center text-2xl tracking-[0.5em]`} />
              </div>
              <div>
                <label className={labelCls}>Mật khẩu mới *</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Xác nhận mật khẩu mới *</label>
                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputCls} />
              </div>
              <button type="submit" className={submitCls} disabled={loading}>{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
              <div className="text-center">
                <button type="button" className={linkCls} onClick={() => switchMode('login')}>← Quay lại Đăng nhập</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
