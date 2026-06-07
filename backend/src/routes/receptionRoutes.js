// Owner: Quốc — Receptionist APIs (UC-26→43)
const router = require('express').Router()
const { protect, authorize } = require('../middlewares/authMiddleware')
const { validateObjectId } = require('../middlewares/validateMiddleware')
const c = require('../controllers/receptionController')

router.use(protect, authorize('receptionist'))

// Giai đoạn 1 — đọc dữ liệu
router.get('/rooms', c.listRooms)                 // UC-26 danh sách phòng + trạng thái
router.get('/bookings', c.listBookings)           // UC-27/43 danh sách + lọc booking
router.get('/bookings/:id', validateObjectId('id'), c.getBookingDetail) // UC-28 chi tiết booking

// Giai đoạn 2 — vòng đời booking
router.post('/bookings', c.walkIn)                                                      // UC-29 walk-in
router.post('/bookings/:id/confirm-deposit', validateObjectId('id'), c.confirmDeposit)  // thu cọc -> confirmed
router.post('/bookings/:id/check-in', validateObjectId('id'), c.checkIn)                // UC-30
router.post('/bookings/:id/check-out', validateObjectId('id'), c.checkOut)              // UC-31
router.post('/bookings/:id/complete', validateObjectId('id'), c.complete)               // -> completed
router.post('/bookings/:id/bed-surcharge', validateObjectId('id'), c.setBedSurcharge)   // bật/tắt phụ phí giường phụ

// TODO(Quốc) GĐ3/4: bill (extra service / missing amenity), cancel, no-show, transfer, schedule/timeline, transactions

module.exports = router
