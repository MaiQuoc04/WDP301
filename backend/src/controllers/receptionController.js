const svc = require('../services/receptionService')

const handle = (fn, code = 200) => async (req, res) => {
  try { res.status(code).json({ success: true, data: await fn(req) }) }
  catch (err) { res.status(err.status || 400).json({ success: false, message: err.message }) }
}

exports.listRooms = handle((req) => svc.listRooms(req.user.id, req.query))         // UC-26
exports.listBookings = handle((req) => svc.listBookings(req.user.id, req.query))   // UC-27/43
exports.getBookingDetail = handle((req) => svc.getBookingDetail(req.user.id, req.params.id)) // UC-28
