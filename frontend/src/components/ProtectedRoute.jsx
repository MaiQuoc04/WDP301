// Sprint 0 — guard route theo role. Dùng trong AppRoutes.
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ allow = [], children }) => {
  const { user, token } = useSelector((s) => s.auth)
  if (!token) return <Navigate to="/login" replace />
  if (allow.length && !allow.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default ProtectedRoute
