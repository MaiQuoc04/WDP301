// Owner: Khánh — Customer APIs (UC-01→25): auth customer, booking online, payment, review
const router = require('express').Router()
const { protect } = require('../middlewares/authMiddleware')

const customerController = require('../controllers/customerController')

router.get('/bookings', protect, customerController.getBookingHistory)
router.post('/bookings', customerController.createBooking)
router.get('/bookings/:id', customerController.getBookingDetail)
router.post('/bookings/:id/payos-link', customerController.createPaymentLink)

module.exports = router
