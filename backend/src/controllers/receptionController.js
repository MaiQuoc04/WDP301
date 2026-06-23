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
exports.confirmDeposit = handle((req) => svc.confirmDeposit(req.user.id, req.params.id, req.body))
exports.checkIn = handle((req) => svc.checkIn(req.user.id, req.params.id, req.body))  // UC-30
exports.checkOut = handle((req) => svc.checkOut(req.user.id, req.params.id, req.body)) // UC-31
exports.complete = handle((req) => svc.complete(req.user.id, req.params.id))
exports.setBedSurcharge = handle((req) => svc.setBedSurcharge(req.user.id, req.params.id, req.body.apply))

// GĐ3 — bill
exports.getBill = handle((req) => svc.getBill(req.user.id, req.params.id))                      // UC-34
exports.addService = handle((req) => svc.addService(req.user.id, req.params.id, req.body), 201)  // UC-32
exports.removeService = handle((req) => svc.removeService(req.user.id, req.params.id, req.params.lineId))
exports.serviceBoard = handle((req) => svc.getServiceBoard(req.user.id))  // bảng triển khai dịch vụ theo phòng
exports.setServiceDelivered = handle((req) => svc.setServiceDelivered(req.user.id, req.params.id, req.params.lineId, req.body.delivered))
exports.addMissingAmenity = handle((req) => svc.addMissingAmenity(req.user.id, req.params.id, req.body), 201) // UC-33
exports.removeMissingAmenity = handle((req) => svc.removeMissingAmenity(req.user.id, req.params.id, req.params.lineId))

// GĐ4 — huỷ / no-show
exports.cancel = handle((req) => svc.cancel(req.user.id, req.params.id, req.body))      // UC-35
exports.markNoShow = handle((req) => svc.markNoShow(req.user.id, req.params.id))        // UC-36
exports.transfer = handle((req) => svc.transfer(req.user.id, req.params.id, req.body))  // UC-37
exports.update = handle((req) => svc.update(req.user.id, req.params.id, req.body))       // UC-38

// GĐ5 — lịch phòng + giao dịch
exports.getSchedule = handle((req) => svc.getSchedule(req.user.id, req.query))                 // UC-39/40
exports.listTransactions = handle((req) => svc.listTransactions(req.user.id, req.query))       // UC-41
exports.getTransaction = handle((req) => svc.getTransaction(req.user.id, req.params.id))       // UC-42
