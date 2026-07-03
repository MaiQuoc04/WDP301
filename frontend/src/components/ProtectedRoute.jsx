// Sprint 0 — guard route theo role. Dùng trong AppRoutes.
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { socket, connectSocket } from '../services/socketService'

const ProtectedRoute = ({ allow = [], children }) => {
  const { user, token } = useSelector((s) => s.auth)
  const dispatch = useDispatch()

  // Đá văng realtime khi admin khoá tài khoản / chi nhánh: BE bắn 'force_logout' -> đăng xuất + về màn khoá.
  useEffect(() => {
    if (!token) return undefined
    connectSocket()
    const onForceLogout = (evt) => {
      const reason = evt?.reason === 'account_locked' ? 'account' : evt?.reason === 'branch_locked' ? 'branch' : ''
      dispatch(logout())
      window.location.href = reason ? `/login?locked=${reason}` : '/login'
    }
    socket.on('force_logout', onForceLogout)
    return () => socket.off('force_logout', onForceLogout)
  }, [token, dispatch])

  if (!token) return <Navigate to="/login" replace />
  if (allow.length && !allow.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default ProtectedRoute
