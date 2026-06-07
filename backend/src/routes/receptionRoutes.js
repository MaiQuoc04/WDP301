// Owner: Quốc — Receptionist APIs (UC-26→43)
const router = require('express').Router()
const { protect, authorize } = require('../middlewares/authMiddleware')
const c = require('../controllers/receptionController')

router.use(protect, authorize('receptionist'))

// Giai đoạn 1 — đọc dữ liệu
router.get('/rooms', c.listRooms)                 // UC-26 danh sách phòng + trạng thái
router.get('/bookings', c.listBookings)           // UC-27/43 danh sách + lọc booking
router.get('/bookings/:id', c.getBookingDetail)   // UC-28 chi tiết booking

// TODO(Quốc) GĐ2+: walk-in, confirm-deposit, check-in, check-out, complete,
//   bill (extra service / missing amenity), cancel, no-show, transfer, schedule/timeline, transactions

module.exports = router
