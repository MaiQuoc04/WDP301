const svc = require('../services/receptionService')

const handle = (fn, code = 200) => async (req, res) => {
  try { res.status(code).json({ success: true, data: await fn(req) }) }
  catch (err) { res.status(err.status || 400).json({ success: false, message: err.message }) }
}

exports.listRooms = handle((req) => svc.listRooms(req.user.id, req.query))         // UC-26
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
exports.addMissingAmenity = handle((req) => svc.addMissingAmenity(req.user.id, req.params.id, req.body), 201) // UC-33
exports.removeMissingAmenity = handle((req) => svc.removeMissingAmenity(req.user.id, req.params.id, req.params.lineId))
