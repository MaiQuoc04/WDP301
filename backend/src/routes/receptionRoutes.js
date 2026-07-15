// Owner: Quốc — Receptionist APIs (UC-26→43)
const router = require('express').Router()
const { protect, authorize } = require('../middlewares/authMiddleware')
const { validateObjectId } = require('../middlewares/validateMiddleware')
const c = require('../controllers/receptionController')

router.use(protect, authorize('receptionist'))

// Danh mục (cho dropdown bill)
router.get('/services', c.listServices)
router.get('/amenities', c.listAmenities)

// Giai đoạn 1 — đọc dữ liệu
router.get('/rooms', c.listRooms)                 // UC-26 danh sách phòng + trạng thái
router.get('/rooms/available', c.searchRooms)     // tìm phòng trống + hợp party (walk-in bước 2)
router.get('/bookings', c.listBookings)           // UC-27/43 danh sách + lọc booking
router.get('/bookings/:id', validateObjectId('id'), c.getBookingDetail) // UC-28 chi tiết booking

// UC-29 (mở rộng) — đặt nhiều phòng cho cùng nhóm khách
router.post('/booking-groups/quote', c.quoteGroup)                                       // báo giá theo phân bổ khách
router.post('/booking-groups', c.createGroup)                                            // tạo nhóm nhiều phòng
router.get('/booking-groups/:id', validateObjectId('id'), c.getGroup)                    // chi tiết nhóm
router.post('/booking-groups/:id/confirm-deposit', validateObjectId('id'), c.confirmGroupDeposit) // thu cọc gom
router.post('/booking-groups/:id/check-in', validateObjectId('id'), c.checkInGroup)     // nhận cả nhóm
router.post('/booking-groups/:id/check-out', validateObjectId('id'), c.checkOutGroup)   // trả cả nhóm (tự phân HK + thu gom)
router.get('/booking-groups/:id/check-out/preview', validateObjectId('id'), c.previewCheckOutGroup) // xem trước: phòng + ai dọn + tiền thu
router.post('/booking-groups/:id/cancel', validateObjectId('id'), c.cancelGroupAll)     // huỷ cả nhóm
router.post('/booking-groups/:id/no-show', validateObjectId('id'), c.noShowGroup)       // no-show cả nhóm
router.post('/booking-groups/:id/payos-qr', validateObjectId('id'), c.createGroupQR)         // Gen QR gom (cọc/toàn bộ/tiền còn lại)
router.post('/booking-groups/:id/sync-payments', validateObjectId('id'), c.syncGroupPayments) // Polling PayOS nhóm

// Giai đoạn 2 — vòng đời booking
router.post('/bookings', c.walkIn)                                                      // UC-29 walk-in
router.post('/bookings/:id/confirm-deposit', validateObjectId('id'), c.confirmDeposit)  // thu cọc -> confirmed
router.post('/bookings/:id/deposit-qr', validateObjectId('id'), c.createDepositQR)       // Gen QR PayOS thu cọc
router.post('/bookings/:id/check-in', validateObjectId('id'), c.checkIn)                // UC-30
router.post('/bookings/:id/check-out', validateObjectId('id'), c.checkOut)              // UC-31 (legacy - cash mặc định)
router.post('/bookings/:id/checkout-qr', validateObjectId('id'), c.createCheckoutQR)   // Gen QR PayOS thu tiền còn lại
router.post('/bookings/:id/checkout-cash', validateObjectId('id'), c.checkOutCash)      // Tiền mặt — xác nhận trực tiếp
router.post('/bookings/:id/sync-payments', validateObjectId('id'), c.syncPayments)      // Polling: kiểm tra PayOS đã nhận tiền chưa
router.post('/bookings/:id/complete', validateObjectId('id'), c.complete)               // -> completed
router.post('/bookings/:id/bed-surcharge', validateObjectId('id'), c.setBedSurcharge)   // bật/tắt phụ phí giường phụ
router.post('/bookings/:id/early-checkin', validateObjectId('id'), c.setEarlyCheckin)   // nhận sớm (giờ)
router.post('/bookings/:id/late-checkout', validateObjectId('id'), c.setLateCheckout)   // trả muộn (giờ)

// Giai đoạn 3 — Bill
router.get('/bookings/:id/bill', validateObjectId('id'), c.getBill)                                          // UC-34
router.post('/bookings/:id/services', validateObjectId('id'), c.addService)                                  // UC-32
router.delete('/bookings/:id/services/:lineId', validateObjectId('id'), validateObjectId('lineId'), c.removeService)
router.patch('/bookings/:id/services/:lineId', validateObjectId('id'), validateObjectId('lineId'), c.setServiceDelivered) // toggle đã giao
router.get('/service-board', c.serviceBoard)                                                                 // bảng triển khai dịch vụ theo phòng

// Housekeeping — lễ tân yêu cầu kiểm tra / dọn phòng + xem trạng thái
router.post('/bookings/:id/request-inspection', validateObjectId('id'), c.requestInspection)   // tạo task kiểm tra thiết bị
router.post('/bookings/:id/request-cleaning', validateObjectId('id'), c.requestCleaning)       // tạo task dọn phòng (giữa kỳ)
router.get('/bookings/:id/housekeeping', validateObjectId('id'), c.getBookingHousekeeping)     // trạng thái + lịch sử
router.get('/bookings/:id/housekeepers', validateObjectId('id'), c.getHousekeeperSuggestions)  // gợi ý housekeeper để giao việc
router.post('/bookings/:id/missing-amenities', validateObjectId('id'), c.addMissingAmenity)                  // UC-33
router.delete('/bookings/:id/missing-amenities/:lineId', validateObjectId('id'), validateObjectId('lineId'), c.removeMissingAmenity)

// Giai đoạn 4 — huỷ / no-show
router.post('/bookings/:id/cancel', validateObjectId('id'), c.cancel)       // UC-35 huỷ trước check-in
router.post('/bookings/:id/no-show', validateObjectId('id'), c.markNoShow)  // UC-36 giữ cọc
router.post('/bookings/:id/transfer', validateObjectId('id'), c.transfer)   // UC-37 đổi phòng in-house
router.patch('/bookings/:id', validateObjectId('id'), c.update)             // UC-38 cập nhật booking

// Hộp thư liên hệ (khách gửi từ trang Contact)
router.get('/contacts', c.listContacts)
router.patch('/contacts/:id/handle', validateObjectId('id'), c.handleContact)

// Dashboard — thông số trong ngày
router.get('/dashboard', c.getDashboard)

// Giai đoạn 5 — lịch phòng + giao dịch
router.get('/schedule', c.getSchedule)                                          // UC-39/40 lịch/timeline phòng
router.get('/transactions', c.listTransactions)                                 // UC-41 danh sách giao dịch
router.get('/transactions/:id', validateObjectId('id'), c.getTransaction)       // UC-42 chi tiết

module.exports = router
