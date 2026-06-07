const router = require('express').Router()
const c = require('../controllers/authController')
const { protect } = require('../middlewares/authMiddleware')

// Public
router.post('/register', c.register)          // UC-01
router.post('/verify-otp', c.verifyOtp)       // UC-02
router.post('/resend-otp', c.resendOtp)       // UC-06
router.post('/login', c.login)                // UC-03
router.post('/google', c.google)              // UC-04 (stub)
router.post('/forgot-password', c.forgotPassword) // UC-05
router.post('/reset-password', c.resetPassword)

// Protected
router.post('/logout', protect, c.logout)             // UC-07
router.get('/me', protect, c.me)                       // UC-08
router.post('/change-password', protect, c.changePassword) // UC-10

module.exports = router
