const router = require('express').Router()
const authController = require('../controllers/authController')
const { protect } = require('../middlewares/authMiddleware')
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', protect, authController.logout)
module.exports = router
