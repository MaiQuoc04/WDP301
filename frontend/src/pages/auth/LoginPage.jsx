import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials } from '../../redux/slices/authSlice'
import { authService } from '../../services'

const HOME_BY_ROLE = {
  receptionist: '/reception', customer: '/customer', housekeeper: '/housekeeping',
  branch_manager: '/manager', super_admin: '/admin',
}

export default function LoginPage() {
  const [email, setEmail] = useState('receptionist@hbms.com')
  const [password, setPassword] = useState('Recept@123')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const res = await authService.login({ email, password })
      const { token, user } = res.data.data
      dispatch(setCredentials({ token, user }))
      nav(HOME_BY_ROLE[user.role] || '/')
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Đăng nhập thất bại')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h2>Đăng nhập HBMS</h2>
      <form onSubmit={submit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
          style={{ display: 'block', width: '100%', padding: 8, margin: '8px 0', boxSizing: 'border-box' }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mật khẩu"
          style={{ display: 'block', width: '100%', padding: 8, margin: '8px 0', boxSizing: 'border-box' }} />
        {err && <div style={{ color: 'crimson', margin: '8px 0' }}>{err}</div>}
        <button disabled={loading} style={{ width: '100%', padding: 10 }}>{loading ? '...' : 'Đăng nhập'}</button>
      </form>
      <p style={{ color: '#888', fontSize: 13 }}>Mặc định: receptionist@hbms.com / Recept@123</p>
    </div>
  )
}
