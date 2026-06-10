const jwt = require('jsonwebtoken')
exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next() }
  catch { res.status(401).json({ message: 'Token invalid or expired' }) }
}
// Sprint 0: phân quyền theo 1 hoặc nhiều role.
// Yêu cầu JWT payload có `role` (Quốc bổ sung khi migrate auth sang Account).
// VD: router.use(protect, authorize('receptionist'))
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  next()
}

// @deprecated — giữ tạm cho code cũ, dùng authorize('super_admin') thay thế
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  next()
}
