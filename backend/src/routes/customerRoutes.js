// Owner: Khánh — Customer APIs (UC-01→25): auth customer, booking online, payment, review
const router = require('express').Router()
const { protect } = require('../middlewares/authMiddleware')

const customerController = require('../controllers/customerController')
const { validateObjectId } = require('../middlewares/validateMiddleware')

router.get('/bookings', protect, customerController.getBookingHistory)
router.post('/bookings', protect, customerController.createBooking)  // đặt online phải đăng nhập → gắn đúng customer
router.get('/bookings/:id', validateObjectId('id'), customerController.getBookingDetail)
router.post('/bookings/:id/payos-link', validateObjectId('id'), customerController.createPaymentLink)

// Webhook PayOS — KHÔNG dùng auth (PayOS gọi từ server của họ)
// Raw body middleware không cần (express.json() đủ với PayOS)
router.post('/payos-webhook', customerController.payosWebhook)

module.exports = router
