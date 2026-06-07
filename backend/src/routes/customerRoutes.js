// Owner: Khánh — Customer APIs (UC-01→25): auth customer, booking online, payment, review
const router = require('express').Router()
// const { protect, authorize } = require('../middlewares/authMiddleware')

// TODO(Khánh): register/otp/google/forgot (public) + (protect, authorize('customer')) cho:
//   POST /bookings  -> gọi bookingService.create() (hợp đồng của Quốc)
//   GET  /bookings, /bookings/:id/bill, /payments, POST /reviews ...

module.exports = router
