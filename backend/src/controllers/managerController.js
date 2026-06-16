// Owner: Hoàng — Branch Manager controllers (UC-57→62 + RoomPrice)
// Pattern: handle() bọc try/catch đồng nhất với authController.js của Sprint 0.
const svc = require('../services/managerService')

const handle = (fn, okCode = 200) => async (req, res) => {
  try {
    res.status(okCode).json({ success: true, data: await fn(req) })
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message })
  }
}

// ─── RoomType ─────────────────────────────────────────────────────────────────
exports.getRoomTypes        = handle((req) => svc.getRoomTypes(req.branchId))
exports.getRoomTypeOptions  = handle((req) => svc.getRoomTypeOptions(req.branchId))
exports.getRoomTypeById     = handle((req) => svc.getRoomTypeById(req.params.id, req.branchId))
exports.createRoomType      = handle((req) => svc.createRoomType(req.body, req.branchId), 201)
exports.updateRoomType      = handle((req) => svc.updateRoomType(req.params.id, req.body, req.branchId))
exports.updateRoomTypeStatus = handle((req) => svc.updateRoomTypeStatus(req.params.id, req.body.status, req.branchId))

// ─── Room ─────────────────────────────────────────────────────────────────────
exports.getRooms        = handle((req) => svc.getRooms(req.query, req.branchId))
exports.getRoomById     = handle((req) => svc.getRoomById(req.params.id, req.branchId))
exports.createRoom      = handle((req) => svc.createRoom(req.body, req.branchId), 201)
exports.updateRoom      = handle((req) => svc.updateRoom(req.params.id, req.body, req.branchId))
exports.updateRoomStatus = handle((req) => svc.updateRoomStatus(req.params.id, req.body.status, req.branchId))
exports.deactivateRoom  = handle((req) => svc.deactivateRoom(req.params.id, req.branchId))

// ─── RoomPrice ────────────────────────────────────────────────────────────────
exports.getRoomPrices           = handle((req) => svc.getRoomPrices(req.branchId))
exports.createOrUpdateRoomPrice = handle((req) => svc.createOrUpdateRoomPrice(req.body, req.branchId), 201)
exports.deleteRoomPrice         = handle((req) => svc.deleteRoomPrice(req.params.id, req.branchId))

// ─── Amenity ──────────────────────────────────────────────────────────────────
exports.getAmenities      = handle((req) => svc.getAmenities(req.branchId))
exports.getAmenityOptions = handle((req) => svc.getAmenityOptions(req.branchId))
exports.createAmenity     = handle((req) => svc.createAmenity(req.body, req.branchId), 201)
exports.updateAmenity     = handle((req) => svc.updateAmenity(req.params.id, req.body, req.branchId))
exports.deactivateAmenity = handle((req) => svc.deactivateAmenity(req.params.id, req.branchId))

// ─── RoomType Amenities mapping ────────────────────────────────────────────────
exports.getRoomTypeAmenities    = handle((req) => svc.getRoomTypeAmenities(req.params.id, req.branchId))
exports.updateRoomTypeAmenities = handle((req) => svc.updateRoomTypeAmenities(req.params.id, req.body.amenityIds, req.branchId))
