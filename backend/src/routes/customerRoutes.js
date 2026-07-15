// Owner: Khánh — Customer APIs (UC-01→25): auth customer, booking online, payment, review
const router = require('express').Router()
const { protect } = require('../middlewares/authMiddleware')

const customerController = require('../controllers/customerController')
const reviewController = require('../controllers/reviewController')
const { validateObjectId } = require('../middlewares/validateMiddleware')


// Đánh giá chi nhánh (UC-22→25) — chỉ khách online đã ở xong, trong 14 ngày, mỗi lần ở 1 lần
router.get('/reviews/reviewable', protect, reviewController.listReviewable) // lần ở nào đang được đánh giá
router.get('/reviews/mine', protect, reviewController.listMine)
router.post('/reviews', protect, reviewController.create)

// Đặt nhiều phòng online (nhóm) — 1 mã, 1 QR cọc gom
router.get('/booking-groups', protect, customerController.getBookingGroupHistory)                          // lịch sử theo nhóm
router.post('/booking-groups/quote', customerController.quoteBookingGroup)                                 // báo giá (không cần đăng nhập)
router.post('/booking-groups', protect, customerController.createBookingGroup)                             // tạo nhóm (gắn customer)
router.get('/booking-groups/:id', protect, validateObjectId('id'), customerController.getBookingGroupDetail)
router.post('/booking-groups/:id/cancel', protect, validateObjectId('id'), customerController.cancelBookingGroup)  // huỷ giữ chỗ khi rời trang
router.post('/booking-groups/:id/payos-link', protect, validateObjectId('id'), customerController.createGroupPaymentLink)

// Webhook PayOS — KHÔNG dùng auth (PayOS gọi từ server của họ)
// Raw body middleware không cần (express.json() đủ với PayOS)
router.post('/payos-webhook', customerController.payosWebhook)

module.exports = router
