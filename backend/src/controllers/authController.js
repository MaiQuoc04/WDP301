const authService = require('../services/authService')

// Bọc try/catch chung cho gọn
const handle = (fn, okCode = 200) => async (req, res) => {
  try {
    res.status(okCode).json({ success: true, data: await fn(req) })
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message })
  }
}

exports.register = handle((req) => authService.register(req.body), 201)
exports.verifyOtp = handle((req) => authService.verifyOtp(req.body))
exports.resendOtp = handle((req) => authService.resendOtp(req.body))
exports.login = handle((req) => authService.login(req.body))
exports.logout = (req, res) => res.json({ success: true, message: 'Đã đăng xuất' })
exports.forgotPassword = handle((req) => authService.forgotPassword(req.body))
exports.resetPassword = handle((req) => authService.resetPassword(req.body))
exports.changePassword = handle((req) => authService.changePassword({ accountId: req.user.id, ...req.body }))
exports.me = handle((req) => authService.getMe(req.user.id))
exports.google = handle((req) => authService.googleLogin(req.body))
