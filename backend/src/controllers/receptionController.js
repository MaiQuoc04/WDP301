const svc = require('../services/receptionService')

const handle = (fn, code = 200) => async (req, res) => {
  try { res.status(code).json({ success: true, data: await fn(req) }) }
  catch (err) { res.status(err.status || 400).json({ success: false, message: err.message }) }
}

exports.listServices = handle((req) => svc.listServices(req.user.id))               // danh mục dịch vụ
exports.listAmenities = handle((req) => svc.listAmenities(req.user.id))             // danh mục thiết bị
exports.listRooms = handle((req) => svc.listRooms(req.user.id, req.query))         // UC-26
exports.searchRooms = handle((req) => svc.searchRooms(req.user.id, req.query))     // tìm phòng cho walk-in
exports.listBookings = handle((req) => svc.listBookings(req.user.id, req.query))   // UC-27/43
exports.getBookingDetail = handle((req) => svc.getBookingDetail(req.user.id, req.params.id)) // UC-28

// GĐ2 — vòng đời
exports.walkIn = handle((req) => svc.walkIn(req.user.id, req.body), 201)              // UC-29

// UC-29 (mở rộng) — đặt nhiều phòng (nhóm)
exports.quoteGroup = handle((req) => svc.quoteGroup(req.user.id, req.body))                     // báo giá theo phân bổ khách
exports.createGroup = handle((req) => svc.createGroup(req.user.id, req.body), 201)              // tạo nhóm nhiều phòng
exports.getGroup = handle((req) => svc.getGroup(req.user.id, req.params.id))                    // chi tiết nhóm
exports.confirmGroupDeposit = handle((req) => svc.confirmGroupDeposit(req.user.id, req.params.id, req.body)) // thu cọc gom nhóm
exports.confirmDeposit = handle((req) => svc.confirmDeposit(req.user.id, req.params.id, req.body))
exports.createDepositQR = handle((req) => svc.createDepositQR(req.user.id, req.params.id)) // Gen QR PayOS thu cọc
exports.checkIn = handle((req) => svc.checkIn(req.user.id, req.params.id, req.body))  // UC-30
exports.checkOut = handle((req) => svc.checkOut(req.user.id, req.params.id, req.body)) // UC-31
exports.complete = handle((req) => svc.complete(req.user.id, req.params.id))
exports.createCheckoutQR = handle((req) => svc.createCheckoutQR(req.user.id, req.params.id)) // Gen QR PayOS khi checkout
exports.checkOutCash = handle((req) => svc.checkOutCash(req.user.id, req.params.id, req.body)) // Tiền mặt
exports.syncPayments = handle((req) => svc.syncPayments(req.user.id, req.params.id))           // Polling PayOS
exports.setBedSurcharge = handle((req) => svc.setBedSurcharge(req.user.id, req.params.id, req.body.apply))
exports.setEarlyCheckin = handle((req) => svc.setEarlyCheckin(req.user.id, req.params.id, req.body.hours))
exports.setLateCheckout = handle((req) => svc.setLateCheckout(req.user.id, req.params.id, req.body.hours))

// GĐ3 — bill
exports.getBill = handle((req) => svc.getBill(req.user.id, req.params.id))                      // UC-34
exports.addService = handle((req) => svc.addService(req.user.id, req.params.id, req.body), 201)  // UC-32
exports.removeService = handle((req) => svc.removeService(req.user.id, req.params.id, req.params.lineId))
exports.serviceBoard = handle((req) => svc.getServiceBoard(req.user.id))  // bảng triển khai dịch vụ theo phòng
exports.setServiceDelivered = handle((req) => svc.setServiceDelivered(req.user.id, req.params.id, req.params.lineId, req.body.delivered))

// Housekeeping — yêu cầu kiểm tra / dọn phòng + trạng thái
exports.requestInspection = handle((req) => svc.requestInspection(req.user.id, req.params.id, req.body.housekeeperId), 201)
exports.requestCleaning = handle((req) => svc.requestCleaning(req.user.id, req.params.id, req.body.housekeeperId), 201)
exports.getBookingHousekeeping = handle((req) => svc.getBookingHousekeeping(req.user.id, req.params.id))
exports.getHousekeeperSuggestions = handle((req) => svc.getHousekeeperSuggestions(req.user.id, req.params.id))
exports.addMissingAmenity = handle((req) => svc.addMissingAmenity(req.user.id, req.params.id, req.body), 201) // UC-33
exports.removeMissingAmenity = handle((req) => svc.removeMissingAmenity(req.user.id, req.params.id, req.params.lineId))

// GĐ4 — huỷ / no-show
exports.cancel = handle((req) => svc.cancel(req.user.id, req.params.id, req.body))      // UC-35
exports.markNoShow = handle((req) => svc.markNoShow(req.user.id, req.params.id))        // UC-36
exports.transfer = handle((req) => svc.transfer(req.user.id, req.params.id, req.body))  // UC-37
exports.update = handle((req) => svc.update(req.user.id, req.params.id, req.body))       // UC-38

// Dashboard — thông số trong ngày
exports.getDashboard = handle((req) => svc.getDashboard(req.user.id))

// GĐ5 — lịch phòng + giao dịch
exports.getSchedule = handle((req) => svc.getSchedule(req.user.id, req.query))                 // UC-39/40
exports.listTransactions = handle((req) => svc.listTransactions(req.user.id, req.query))       // UC-41
exports.getTransaction = handle((req) => svc.getTransaction(req.user.id, req.params.id))       // UC-42
