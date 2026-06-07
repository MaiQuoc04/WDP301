const jwt = require('jsonwebtoken')

// JWT access-only, stateless. Payload có `role` để authorize(...roles) hoạt động.
exports.signAccessToken = (account) =>
  jwt.sign(
    { id: account._id, role: account.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
