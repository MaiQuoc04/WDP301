import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { setCredentials } from '../../redux/slices/authSlice'
import { authService } from '../../services/authService'
import './LoginPage.css'

const LotusLogo = () => (
  <svg className="auth-logo" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" opacity="0.85" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" opacity="0.85" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" opacity="0.65" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" opacity="0.65" />
  </svg>
)

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const redirectUrl = searchParams.get('redirect') || '/'
  const from = location.state?.from || null
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user) {
      if (from) navigate(from)
      else if (user.role === 'customer') navigate('/customer')
      else if (user.role === 'receptionist') navigate('/reception')
      else if (user.role === 'housekeeper') navigate('/housekeeping')
      else if (user.role === 'branch_manager') navigate('/manager')
      else if (user.role === 'super_admin') navigate('/admin')
      else navigate('/')
    }
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

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    clearMessages()
    setPassword('')
    setConfirmPassword('')
    setOtp('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearMessages()

    try {
      const response = await authService.login({ email, password })
      const { token, user } = response.data.data
      
      // Lưu token vào local storage & Redux
      localStorage.setItem('token', token)
      dispatch(setCredentials({ token, user }))
      
      setSuccess('Đăng nhập thành công!')
      setTimeout(() => {
        // Điều hướng dựa trên role hoặc trang trước đó
        if (from) navigate(from)
        else if (user.role === 'customer') navigate('/customer')
        else if (user.role === 'receptionist') navigate('/reception')
        else if (user.role === 'housekeeper') navigate('/housekeeping')
        else if (user.role === 'branch_manager') navigate('/manager')
        else if (user.role === 'super_admin') navigate('/admin')
        else navigate('/')
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)
    clearMessages()

    try {
      await authService.register({ email, password, fullName, phone })
      setSuccess('Đăng ký thành công! Vui lòng nhập mã OTP đã được gửi đến email của bạn.')
      
      setTimeout(() => {
        setMode('otp-verify')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
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
      setTimeout(() => {
        navigate('/')
      }, 1000)
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

      setTimeout(() => {
        setMode('otp-reset')
      }, 2000)
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
      setTimeout(() => {
        switchMode('login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left Side: Brand & Visual */}
        <div className="auth-card__visual">
          <div className="auth-card__visual-overlay"></div>
          <img 
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Luxury Hotel Interior" 
            className="auth-card__visual-img"
          />
          <div className="auth-card__visual-content">
            <LotusLogo />
            <h2>HANOI HOTEL</h2>
            <p className="auth-card__tagline">LIVE ORIENTAL HERITAGE</p>
            <p className="auth-card__sub-desc">
              Trải nghiệm dịch vụ nghỉ dưỡng cao cấp hòa quyện cùng nét đẹp di sản đặc trưng giữa lòng thủ đô.
            </p>
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="auth-card__form-area">
          <div className="auth-card__form-inner">
            {/* Nav Back to Home */}
            <a href="/" className="auth-card__back-home">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Quay lại trang chủ
            </a>

            {/* Form Headers */}
            {mode === 'login' && (
              <div className="auth-header">
                <h3>Đăng Nhập</h3>
                <p>Chào mừng Quý khách quay trở lại</p>
              </div>
            )}
            {mode === 'register' && (
              <div className="auth-header">
                <h3>Đăng Ký</h3>
                <p>Tạo tài khoản nghỉ dưỡng mới</p>
              </div>
            )}
            {mode === 'forgot-password' && (
              <div className="auth-header">
                <h3>Quên Mật Khẩu</h3>
                <p>Nhập email để nhận mã khôi phục tài khoản</p>
              </div>
            )}
            {mode === 'otp-verify' && (
              <div className="auth-header">
                <h3>Xác Thực Tài Khoản</h3>
                <p>Vui lòng nhập mã OTP đã được gửi đến {email}</p>
              </div>
            )}
            {mode === 'otp-reset' && (
              <div className="auth-header">
                <h3>Đặt Lại Mật Khẩu</h3>
                <p>Vui lòng nhập mã OTP và mật khẩu mới</p>
              </div>
            )}

            {/* Feedback Messages */}
            {error && <div className="auth-alert auth-alert--error">{error}</div>}
            {success && <div className="auth-alert auth-alert--success">{success}</div>}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-field">
                  <label>Địa chỉ Email *</label>
                  <input 
                    type="email" 
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="auth-field">
                  <label>Mật khẩu *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="auth-options">
                  <button 
                    type="button" 
                    className="auth-btn-link"
                    onClick={() => switchMode('forgot-password')}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
                  {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
                </button>
                <div className="auth-switch">
                  Chưa có tài khoản?{' '}
                  <button type="button" className="auth-btn-link-highlight" onClick={() => switchMode('register')}>
                    Đăng ký ngay
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                <div className="auth-field">
                  <label>Họ và tên *</label>
                  <input 
                    type="text" 
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                  />
                </div>
                <div className="auth-field">
                  <label>Địa chỉ Email *</label>
                  <input 
                    type="email" 
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="auth-field">
                  <label>Số điện thoại *</label>
                  <input 
                    type="tel" 
                    placeholder="0901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required 
                  />
                </div>
                <div className="auth-field">
                  <label>Mật khẩu *</label>
                  <input 
                    type="password" 
                    placeholder="•••••••• (Tối thiểu 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required 
                  />
                </div>
                <div className="auth-field">
                  <label>Xác nhận mật khẩu *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
                  {loading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
                </button>
                <div className="auth-switch">
                  Đã có tài khoản?{' '}
                  <button type="button" className="auth-btn-link-highlight" onClick={() => switchMode('login')}>
                    Đăng nhập
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <p className="auth-form-tip">
                  Chúng tôi sẽ gửi mã OTP khôi phục mật khẩu đến địa chỉ email của bạn nếu nó tồn tại trên hệ thống.
                </p>
                <div className="auth-field">
                  <label>Địa chỉ Email của bạn *</label>
                  <input 
                    type="email" 
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
                  {loading ? 'ĐANG GỬI OTP...' : 'GỬI MÃ KHÔI PHỤC'}
                </button>
                <div className="auth-switch">
                  <button type="button" className="auth-btn-link" onClick={() => switchMode('login')}>
                    Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            )}

            {/* OTP VERIFICATION FORM */}
            {mode === 'otp-verify' && (
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="auth-field">
                  <label>Nhập mã OTP gồm 6 chữ số *</label>
                    <input 
                      type="password" 
                      maxLength="6"
                      placeholder="••••••"
                      className="auth-otp-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required 
                    />
                </div>
                <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
                  {loading ? 'ĐANG XÁC THỰC...' : 'XÁC THỰC OTP'}
                </button>
                <div className="auth-switch">
                  <button type="button" className="auth-btn-link" onClick={() => switchMode('register')}>
                    Thay đổi thông tin đăng ký
                  </button>
                </div>
              </form>
            )}

            {/* OTP RESET PASSWORD FORM */}
            {mode === 'otp-reset' && (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="auth-field">
                  <label>Nhập mã OTP gồm 6 chữ số *</label>
                    <input 
                      type="password" 
                      maxLength="6"
                      placeholder="••••••"
                      className="auth-otp-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required 
                    />
                </div>
                <div className="auth-field">
                  <label>Mật khẩu mới *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required 
                  />
                </div>
                <div className="auth-field">
                  <label>Xác nhận mật khẩu mới *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn--primary auth-submit-btn" disabled={loading}>
                  {loading ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU'}
                </button>
                <div className="auth-switch">
                  <button type="button" className="auth-btn-link" onClick={() => switchMode('login')}>
                    Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
