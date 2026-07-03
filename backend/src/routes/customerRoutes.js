// Owner: Khánh — Customer APIs (UC-01→25): auth customer, booking online, payment, review
const router = require('express').Router()
const { protect } = require('../middlewares/authMiddleware')

const customerController = require('../controllers/customerController')
const { validateObjectId } = require('../middlewares/validateMiddleware')

router.get('/bookings', protect, customerController.getBookingHistory)
router.post('/bookings', protect, customerController.createBooking)  // đặt online phải đăng nhập → gắn đúng customer
router.get('/bookings/:id', validateObjectId('id'), customerController.getBookingDetail)
router.post('/bookings/:id/payos-link', validateObjectId('id'), customerController.createPaymentLink)

// Đặt nhiều phòng online (nhóm) — 1 mã, 1 QR cọc gom
router.get('/booking-groups', protect, customerController.getBookingGroupHistory)                          // lịch sử theo nhóm
router.post('/booking-groups/quote', customerController.quoteBookingGroup)                                 // báo giá (không cần đăng nhập)
router.post('/booking-groups', protect, customerController.createBookingGroup)                             // tạo nhóm (gắn customer)
router.get('/booking-groups/:id', protect, validateObjectId('id'), customerController.getBookingGroupDetail)
router.post('/booking-groups/:id/payos-link', protect, validateObjectId('id'), customerController.createGroupPaymentLink)

// Webhook PayOS — KHÔNG dùng auth (PayOS gọi từ server của họ)
// Raw body middleware không cần (express.json() đủ với PayOS)
router.post('/payos-webhook', customerController.payosWebhook)

module.exports = router
