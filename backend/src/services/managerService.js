// Owner: Hoàng — Branch Manager service layer (UC-57→62 + RoomPrice)
// Toàn bộ hàm nhận branchId từ req.branchId (do middleware getBranchManagerBranch gán).
// KHÔNG bao giờ tin body.branchId từ client — chỉ dùng branchId từ tham số hàm.
const mongoose  = require('mongoose')
const RoomType  = require('../models/roomTypeModel')
const Room      = require('../models/roomModel')
const RoomPrice = require('../models/roomPriceModel')
const Booking   = require('../models/bookingModel')
const Amenity   = require('../models/amenityModel')
const RoomAmenity = require('../models/roomAmenityModel')
const Service   = require('../models/serviceModel')
const RoomIssue = require('../models/roomIssueModel')
const HousekeepingTask = require('../models/housekeepingTaskModel')
const RoleAssignment = require('../models/roleAssignmentModel')
const notificationService = require('./notificationService')
const contactService = require('./contactService')
const Account = require('../models/accountModel')

const supportsTransactions = process.env.ENABLE_TRANSACTIONS === 'true'

// ─── Hộp thư liên hệ (khách gửi từ trang Contact) ──────────────────────────────
exports.listContacts = (branchId, query = {}) => contactService.listForBranches([branchId], { status: query.status })
exports.handleContact = (branchId, id, by) => contactService.markHandled(id, [branchId], by)

// ─── Helper ──────────────────────────────────────────────────────────────────
// Tìm một entity thuộc chi nhánh (Branch Isolation Helper)
const findBranchEntity = (model, id, branchId, populate = null) => {
  let query = model.findOne({ _id: id, branch: branchId })
  if (populate) {
    query = query.populate(populate)
  }
  return query
}

// Ném lỗi với HTTP status code (controller sẽ bắt và trả về client)
function fail(msg, code = 400) {
  const e = new Error(msg)
  e.status = code
  throw e
}

function parseLocalDate(value) {
  if (value instanceof Date) return new Date(value)
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(value)
}

// Các trạng thái booking đang "chiếm" phòng (nguồn sự thật: bookingModel.BOOKING_STATUS)
const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'checked_in']

// ─── RoomType ─────────────────────────────────────────────────────────────────

// UC-57/58/59: Danh sách RoomType của chi nhánh (tất cả, kể cả inactive — để manager quản lý)
exports.getRoomTypes = async (branchId) => {
  return RoomType.find({ branch: branchId }).sort({ createdAt: -1 })
}

// Dropdown options — chỉ loại phòng đang active (cho các select box của UI)
exports.getRoomTypeOptions = async (branchId) => {
  return RoomType.find({ branch: branchId, status: 'active' }, '_id name bedType capacity basePrice extraBedFee').sort({ name: 1 })
}

// Chi tiết 1 RoomType (chặn xem chéo chi nhánh)
exports.getRoomTypeById = async (id, branchId) => {
  const rt = await findBranchEntity(RoomType, id, branchId)
  if (!rt) fail('Loại phòng không tồn tại', 404)
  return rt
}

// UC-57: Tạo mới RoomType
exports.createRoomType = async (data, branchId) => {
  const { name, tier, bedType, capacity, area, basePrice, extraBedFee, description, images } = data

  if (!name?.trim()) fail('Tên loại phòng không được để trống')
  if (!basePrice || basePrice <= 0) fail('Giá cơ bản phải lớn hơn 0')
  if (capacity != null && capacity <= 0) fail('Sức chứa phải lớn hơn 0')
  if (extraBedFee != null && extraBedFee < 0) fail('Phụ phí giường phụ không được âm')
  if (tier != null && !['standard', 'premium'].includes(tier)) fail('Hạng phòng không hợp lệ')

  // Kiểm tra trùng tên trong chi nhánh
  const exists = await RoomType.findOne({ branch: branchId, name: name.trim() })
  if (exists) fail(`Loại phòng "${name.trim()}" đã tồn tại trong chi nhánh`)

  return RoomType.create({ branch: branchId, name: name.trim(), tier: tier || 'standard', bedType, capacity, area, basePrice, extraBedFee: extraBedFee || 0, description, images })
}

// UC-58: Cập nhật RoomType
exports.updateRoomType = async (id, data, branchId) => {
  const rt = await findBranchEntity(RoomType, id, branchId)
  if (!rt) fail('Loại phòng không tồn tại', 404)

  const { name, tier, bedType, capacity, area, basePrice, extraBedFee, description, images } = data

  if (name != null) {
    const trimmed = name.trim()
    if (!trimmed) fail('Tên loại phòng không được để trống')
    // Kiểm tra trùng tên với RoomType khác trong cùng chi nhánh
    const dup = await RoomType.findOne({ branch: branchId, name: trimmed, _id: { $ne: id } })
    if (dup) fail(`Tên "${trimmed}" đã được dùng bởi loại phòng khác trong chi nhánh`)
    rt.name = trimmed
  }
  if (basePrice != null) {
    if (basePrice <= 0) fail('Giá cơ bản phải lớn hơn 0')
    rt.basePrice = basePrice
  }
  if (capacity != null) {
    if (capacity <= 0) fail('Sức chứa phải lớn hơn 0')
    rt.capacity = capacity
  }
  if (extraBedFee != null) {
    if (extraBedFee < 0) fail('Phụ phí giường phụ không được âm')
    rt.extraBedFee = extraBedFee
  }
  if (tier != null) {
    if (!['standard', 'premium'].includes(tier)) fail('Hạng phòng không hợp lệ')
    rt.tier = tier
  }
  if (bedType != null) rt.bedType = bedType
  if (area != null) rt.area = area
  if (description != null) rt.description = description
  if (images != null) rt.images = images

  return rt.save()
}

// UC-59: Đổi trạng thái RoomType (active ↔ inactive) — Soft delete khi inactive
exports.updateRoomTypeStatus = async (id, status, branchId) => {
  const rt = await findBranchEntity(RoomType, id, branchId)
  if (!rt) fail('Loại phòng không tồn tại', 404)
  if (!['active', 'inactive'].includes(status)) fail('Trạng thái không hợp lệ (active | inactive)')

  if (status === 'inactive') {
    // Chặn nếu còn phòng vật lý đang hoạt động thuộc loại này
    const activeRooms = await Room.countDocuments({ roomType: id, isDeleted: { $ne: true } })
    if (activeRooms > 0) fail(`Không thể ngưng hoạt động — còn ${activeRooms} phòng đang dùng loại này. Vui lòng deactivate các phòng trước.`)

    // Chặn nếu còn booking đang hoạt động theo loại phòng này
    const hasBooking = await Booking.exists({ roomType: id, status: { $in: ACTIVE_BOOKING_STATUSES } })
    if (hasBooking) fail('Không thể ngưng hoạt động — đang có đặt phòng chưa hoàn tất với loại phòng này')
  }

  rt.status = status
  return rt.save()
}

// ─── Room ─────────────────────────────────────────────────────────────────────

// UC-60: Danh sách Room của chi nhánh (bỏ qua phòng đã bị soft delete)
exports.getRooms = async (query, branchId) => {
  const filter = { branch: branchId, isDeleted: { $ne: true } }
  if (query.roomType) filter.roomType = query.roomType
  if (query.status)   filter.status   = query.status
  if (query.floor)    filter.floor    = Number(query.floor)
  return Room.find(filter).populate('roomType', 'name bedType capacity basePrice').sort({ roomNumber: 1 })
}

// Chi tiết 1 phòng (chặn xem chéo chi nhánh)
exports.getRoomById = async (id, branchId) => {
  const room = await Room.findOne({ _id: id, branch: branchId, isDeleted: { $ne: true } })
    .populate('roomType', 'name bedType capacity basePrice')
  if (!room) fail('Phòng không tồn tại', 404)
  return room
}

// UC-61: Tạo phòng mới
exports.createRoom = async (data, branchId) => {
  const { roomType: roomTypeId, roomNumber, floor, status, notes } = data

  if (!roomNumber?.trim()) fail('Số phòng không được để trống')
  if (!roomTypeId) fail('Loại phòng không được để trống')
  if (floor != null && floor < 1) fail('Số tầng phải >= 1')

  // Đảm bảo roomType thuộc chi nhánh này
  const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
  if (!rt) fail('Loại phòng không tồn tại hoặc không thuộc chi nhánh này', 404)
  if (rt.status !== 'active') fail('Không thể tạo phòng cho loại phòng đang ngưng hoạt động')

  // Kiểm tra trùng số phòng trong chi nhánh (kể cả phòng đã bị soft delete → tránh tạo lại cùng số)
  const dup = await Room.findOne({ branch: branchId, roomNumber: roomNumber.trim() })
  if (dup) fail(`Số phòng "${roomNumber.trim()}" đã tồn tại trong chi nhánh`)

  return Room.create({ branch: branchId, roomType: roomTypeId, roomNumber: roomNumber.trim(), floor, status, notes })
}

// UC-62: Cập nhật thông tin phòng
exports.updateRoom = async (id, data, branchId) => {
  const room = await Room.findOne({ _id: id, branch: branchId, isDeleted: { $ne: true } })
  if (!room) fail('Phòng không tồn tại', 404)

  const { roomType: roomTypeId, roomNumber, floor, notes } = data

  if (roomNumber != null) {
    const trimmed = roomNumber.trim()
    if (!trimmed) fail('Số phòng không được để trống')
    const dup = await Room.findOne({ branch: branchId, roomNumber: trimmed, _id: { $ne: id } })
    if (dup) fail(`Số phòng "${trimmed}" đã được dùng bởi phòng khác`)
    room.roomNumber = trimmed
  }
  if (roomTypeId != null) {
    const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
    if (!rt) fail('Loại phòng không tồn tại hoặc không thuộc chi nhánh này', 404)
    room.roomType = roomTypeId
  }
  if (floor != null) {
    if (floor < 1) fail('Số tầng phải >= 1')
    room.floor = floor
  }
  if (notes != null) room.notes = notes

  return room.save()
}

// PATCH /rooms/:id/status — Thay đổi trạng thái nhanh (cleaning, maintenance, available...)
exports.updateRoomStatus = async (id, status, branchId) => {
  const room = await Room.findOne({ _id: id, branch: branchId, isDeleted: { $ne: true } })
  if (!room) fail('Phòng không tồn tại', 404)

  const validStatuses = Room.schema.path('status').enumValues
  if (!validStatuses.includes(status)) fail(`Trạng thái không hợp lệ. Cho phép: ${validStatuses.join(', ')}`)

  room.status = status
  return room.save()
}

// PATCH /rooms/:id/deactivate — Soft delete phòng
exports.deactivateRoom = async (id, branchId) => {
  const room = await Room.findOne({ _id: id, branch: branchId, isDeleted: { $ne: true } })
  if (!room) fail('Phòng không tồn tại', 404)

  // Chặn nếu phòng đang gán cho booking đang hoạt động
  const hasActiveBooking = await Booking.exists({ room: id, status: { $in: ACTIVE_BOOKING_STATUSES } })
  if (hasActiveBooking) fail('Không thể deactivate — phòng đang có đặt phòng chưa hoàn tất')

  room.isDeleted = true
  return room.save()
}

// ─── RoomPrice ────────────────────────────────────────────────────────────────

// Lấy danh sách cấu hình giá động của chi nhánh (populate roomType để biết tên)
exports.getRoomPrices = async (branchId) => {
  // Lấy tất cả roomType thuộc chi nhánh, sau đó join sang RoomPrice
  const roomTypeIds = await RoomType.distinct('_id', { branch: branchId })
  return RoomPrice.find({ roomType: { $in: roomTypeIds } })
    .populate('roomType', 'name basePrice')
    .sort({ roomType: 1, startDate: 1, dayType: 1 })
}

// Tạo hoặc cập nhật cấu hình giá động (upsert)
exports.createOrUpdateRoomPrice = async (data, branchId) => {
  const { roomType: roomTypeId, date, dayType, price, discount } = data
  const nextPrice = Number(price)
  const nextDiscount = Number(discount || 0)

  if (!roomTypeId) fail('Loại phòng không được để trống')
  if (!Number.isFinite(nextPrice) || nextPrice <= 0) fail('Giá phải lớn hơn 0')
  if (!Number.isFinite(nextDiscount) || nextDiscount < 0 || nextDiscount > 99) fail('Giảm giá phải từ 0 đến 99%')
  if (!date && !dayType) fail('Phải chỉ định ngày cụ thể (date) hoặc loại ngày (dayType)')
  if (date && dayType) fail('Chỉ được chỉ định 1 trong 2: ngày cụ thể (date) hoặc loại ngày (dayType)')

  // Đảm bảo roomType thuộc chi nhánh
    const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
  if (!rt) fail('Loại phòng không tồn tại hoặc không thuộc chi nhánh này', 404)

  if (date) {
    const targetDate = parseLocalDate(date)
    if (isNaN(targetDate)) fail('Ngày không hợp lệ')
    // Cấu hình theo ngày cụ thể → upsert theo roomType + date
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0)
    const endOfDay   = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999)
    return RoomPrice.findOneAndUpdate(
      { roomType: roomTypeId, startDate: startOfDay, endDate: endOfDay },
      {
        $set: { roomType: roomTypeId, startDate: startOfDay, endDate: endOfDay, price: nextPrice, discount: nextDiscount },
        $unset: { dayType: '' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    )
  } else {
    const validDayTypes = ['weekday', 'weekend']
    if (!validDayTypes.includes(dayType)) fail('Loại ngày định kỳ chỉ hỗ trợ weekday/weekend. Ngày lễ hãy cấu hình theo ngày cụ thể.')
    // Cấu hình theo loại ngày → upsert theo roomType + dayType
    return RoomPrice.findOneAndUpdate(
      { roomType: roomTypeId, dayType, startDate: { $exists: false }, endDate: { $exists: false } },
      {
        $set: { roomType: roomTypeId, dayType, price: nextPrice, discount: nextDiscount },
        $unset: { startDate: '', endDate: '' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    )
  }
}

// Xóa 1 cấu hình giá động (đây là xóa vật lý vì RoomPrice không có reference bên ngoài)
exports.deleteRoomPrice = async (id, branchId) => {
  const roomTypeIds = await RoomType.distinct('_id', { branch: branchId })
  const rp = await RoomPrice.findOne({ _id: id, roomType: { $in: roomTypeIds } })
  if (!rp) fail('Cấu hình giá không tồn tại', 404)
  await rp.deleteOne()
  return { message: 'Đã xóa cấu hình giá' }
}

// ─── Amenity (CRUD) ────────────────────────────────────────────────────────────

// Lấy danh sách toàn bộ tiện nghi của chi nhánh
exports.getAmenities = async (branchId) => {
  return Amenity.find({ branch: branchId }).sort({ createdAt: -1 })
}

// Lấy danh sách rút gọn tiện nghi đang hoạt động phục vụ dropdown (chỉ lấy name)
exports.getAmenityOptions = async (branchId) => {
  return Amenity.find({ branch: branchId, status: 'active' }, '_id name').sort({ name: 1 })
}

// Tạo mới tiện nghi
exports.createAmenity = async (data, branchId) => {
  const { name, missingPrice, unit } = data

  if (!name?.trim()) fail('Tên tiện nghi không được để trống')
  if (missingPrice != null && missingPrice < 0) fail('Giá phạt khi mất mát phải >= 0')

  // Đảm bảo tên tiện nghi độc nhất trong cùng chi nhánh
  const trimmedName = name.trim()
  const exists = await Amenity.findOne({ branch: branchId, name: trimmedName })
  if (exists) fail(`Tiện nghi "${trimmedName}" đã tồn tại trong chi nhánh`)

  return Amenity.create({
    branch: branchId,
    name: trimmedName,
    missingPrice: missingPrice || 0,
    unit: unit || 'cái',
    status: 'active'
  })
}

// Cập nhật thông tin tiện nghi
exports.updateAmenity = async (id, data, branchId) => {
  const am = await findBranchEntity(Amenity, id, branchId)
  if (!am) fail('Tiện nghi không tồn tại', 404)

  const { name, missingPrice, unit } = data

  if (name != null) {
    const trimmed = name.trim()
    if (!trimmed) fail('Tên tiện nghi không được để trống')
    // Kiểm tra trùng tên với Amenity khác trong cùng chi nhánh
    const dup = await Amenity.findOne({ branch: branchId, name: trimmed, _id: { $ne: id } })
    if (dup) fail(`Tên tiện nghi "${trimmed}" đã tồn tại trong chi nhánh`)
    am.name = trimmed
  }

  if (missingPrice != null) {
    if (missingPrice < 0) fail('Giá phạt khi mất mát phải >= 0')
    am.missingPrice = missingPrice
  }

  if (unit != null) am.unit = unit

  return am.save()
}

// Đổi trạng thái tiện nghi thành inactive (Deactivate) và tự động gỡ khỏi RoomTypes & RoomAmenities
exports.deactivateAmenity = async (id, branchId) => {
  const am = await findBranchEntity(Amenity, id, branchId)
  if (!am) fail('Tiện nghi không tồn tại', 404)

  am.status = 'inactive'
  await am.save()

  // Tự động gỡ tiện nghi này ra khỏi mảng amenities của mọi RoomType trong chi nhánh
  await RoomType.updateMany(
    { branch: branchId },
    { $pull: { amenities: id } }
  )

  // Tự động gỡ tiện nghi này khỏi tất cả phòng vật lý (RoomAmenity)
  await RoomAmenity.deleteMany({ amenity: id })

  return am
}

// ─── RoomType Amenities mapping ────────────────────────────────────────────────

// Lấy danh sách tiện nghi của một RoomType cụ thể
exports.getRoomTypeAmenities = async (roomTypeId, branchId) => {
  const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
    .populate('amenities', 'name missingPrice unit status')
  if (!rt) fail('Loại phòng không tồn tại', 404)

  return rt.amenities
}

// Cập nhật danh sách tiện nghi cho một RoomType
exports.updateRoomTypeAmenities = async (roomTypeId, amenityIds, branchId) => {
  const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
  if (!rt) fail('Loại phòng không tồn tại', 404)

  if (!Array.isArray(amenityIds)) fail('Danh sách ID tiện nghi không hợp lệ')

  // Loại bỏ các ID trùng lặp
  const uniqueIds = [...new Set(amenityIds.map(String))]

  // Kiểm tra xem tất cả các tiện nghi có thuộc chi nhánh này và đang hoạt động (active) hay không
  const validAmenitiesCount = await Amenity.countDocuments({
    _id: { $in: uniqueIds },
    branch: branchId,
    status: 'active'
  })

  if (validAmenitiesCount !== uniqueIds.length) {
    fail('Một hoặc nhiều tiện nghi không hợp lệ hoặc không thuộc chi nhánh này hoặc đang bị ngưng hoạt động')
  }

  rt.amenities = uniqueIds
  await rt.save()

  // Trả về danh sách đã được populate
  const updatedRt = await RoomType.findById(roomTypeId).populate('amenities', 'name missingPrice unit status')
  return updatedRt.amenities
}

// ─── Số lượng CHUẨN thiết bị theo loại phòng (baseline kiểm kê) ──────────────────
// Liệt kê amenity của loại phòng kèm số chuẩn (mặc định 1 nếu chưa set).
exports.getRoomTypeStandards = async (roomTypeId, branchId) => {
  const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
    .populate('amenities', 'name unit missingPrice status')
    .populate('amenityStandards.amenity', 'name unit missingPrice status')
  if (!rt) fail('Loại phòng không tồn tại', 404)
  const qty = {}
  ;(rt.amenityStandards || []).forEach((s) => { if (s.amenity) qty[String(s.amenity._id)] = s.quantity })
  return (rt.amenities || [])
    .filter((a) => a && a.status !== 'inactive')
    .map((a) => ({ amenity: a, quantity: qty[String(a._id)] ?? 1 }))
}

// Set số chuẩn: items = [{ amenity, quantity }]
exports.updateRoomTypeStandards = async (roomTypeId, items, branchId) => {
  const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
  if (!rt) fail('Loại phòng không tồn tại', 404)
  if (!Array.isArray(items)) fail('Danh sách số lượng chuẩn không hợp lệ')
  const ids = items.map((i) => i.amenity).filter(Boolean)
  const valid = await Amenity.find({ _id: { $in: ids }, branch: branchId }).select('_id').lean()
  const ok = new Set(valid.map((a) => String(a._id)))
  rt.amenityStandards = items
    .filter((i) => i.amenity && ok.has(String(i.amenity)))
    .map((i) => ({ amenity: i.amenity, quantity: Math.max(0, Number(i.quantity) || 0) }))
  await rt.save()
  return exports.getRoomTypeStandards(roomTypeId, branchId)
}

// ─── Restock: bổ sung thiết bị cho phòng (đối chiếu chuẩn vs hiện có) ────────────
// Khớp logic buildAmenityReport: liệt kê tiện nghi (active) của loại phòng;
// số chuẩn = amenityStandards (nếu đã set) hoặc mặc định 1 — tránh "No data" khi manager chưa set chuẩn.
async function standardMap(roomTypeId) {
  const rt = await RoomType.findById(roomTypeId)
    .populate('amenities', 'name unit status')
    .lean()
  const qty = {}
  ;(rt?.amenityStandards || []).forEach((s) => { if (s.amenity) qty[String(s.amenity)] = s.quantity })
  const m = {}
  ;(rt?.amenities || [])
    .filter((a) => a && a.status !== 'inactive')
    .forEach((a) => { m[String(a._id)] = { name: a.name, unit: a.unit, quantity: qty[String(a._id)] ?? 1 } })
  return m
}

// Phòng đã dọn xong nhưng thiếu đồ, đang chờ bổ sung.
exports.getRestockRooms = async (branchId) => {
  return Room.find({ branch: branchId, isDeleted: { $ne: true }, awaitingRestock: true })
    .populate('roomType', 'name')
    .sort('roomNumber').lean()
}

// Chi tiết tồn kho 1 phòng: chuẩn vs hiện có.
exports.getRoomInventory = async (roomId, branchId) => {
  const room = await findBranchEntity(Room, roomId, branchId).populate('roomType', 'name')
  if (!room) fail('Phòng không tồn tại', 404)
  const std = await standardMap(room.roomType._id)
  const ras = await RoomAmenity.find({ room: roomId }).lean()
  const cur = {}
  ras.forEach((ra) => { cur[String(ra.amenity)] = ra.quantity })
  const items = Object.entries(std).map(([amenityId, s]) => ({
    amenity: amenityId, name: s.name, unit: s.unit,
    standard: s.quantity, current: cur[amenityId] ?? 0,
  }))
  return {
    room: { _id: room._id, roomNumber: room.roomNumber, status: room.status, awaitingRestock: room.awaitingRestock, roomType: room.roomType },
    items,
  }
}

// Cập nhật số hiện có (restock). Đủ chuẩn + phòng đang chờ -> available.
exports.updateRoomInventory = async (roomId, items, branchId) => {
  const room = await findBranchEntity(Room, roomId, branchId)
  if (!room) fail('Phòng không tồn tại', 404)
  if (!Array.isArray(items)) fail('Danh sách số lượng không hợp lệ')
  for (const it of items) {
    if (!it.amenity) continue
    await RoomAmenity.findOneAndUpdate(
      { room: roomId, amenity: it.amenity },
      { room: roomId, amenity: it.amenity, quantity: Math.max(0, Number(it.quantity) || 0) },
      { upsert: true, setDefaultsOnInsert: true }
    )
  }
  const std = await standardMap(room.roomType)
  const ras = await RoomAmenity.find({ room: roomId }).lean()
  const cur = {}
  ras.forEach((ra) => { cur[String(ra.amenity)] = ra.quantity })
  const short = Object.entries(std).some(([aid, s]) => (cur[aid] ?? 0) < s.quantity)
  if (!short && room.awaitingRestock) {
    room.awaitingRestock = false
    if (room.status === 'cleaning') room.status = 'available' // đã dọn + đủ chuẩn -> mở bán
    await room.save()
  }
  return exports.getRoomInventory(roomId, branchId)
}

// ─── Service (CRUD) ────────────────────────────────────────────────────────────

// Lấy danh sách toàn bộ dịch vụ của chi nhánh
exports.getServices = async (branchId) => {
  return Service.find({ branch: branchId }).sort({ createdAt: -1 })
}

// Lấy thông tin chi tiết một dịch vụ
exports.getServiceById = async (id, branchId) => {
  const svc = await findBranchEntity(Service, id, branchId)
  if (!svc) fail('Dịch vụ không tồn tại', 404)
  return svc
}

// Lấy danh sách rút gọn dịch vụ đang hoạt động phục vụ dropdown (sắp xếp theo tên)
exports.getServiceOptions = async (branchId) => {
  const services = await Service.find({ branch: branchId, status: 'active' }, '_id name price')
  return services.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

// Tạo mới dịch vụ
exports.createService = async (data, branchId) => {
  const { name, price, description } = data

  if (!name?.trim()) fail('Tên dịch vụ không được để trống')
  if (price == null || price <= 0) fail('Giá dịch vụ phải lớn hơn 0')

  // Đảm bảo tên dịch vụ độc nhất trong cùng chi nhánh
  const trimmedName = name.trim()
  const exists = await Service.findOne({ branch: branchId, name: trimmedName })
  if (exists) fail('Dịch vụ đã tồn tại trong chi nhánh')

  try {
    return await Service.create({
      branch: branchId,
      name: trimmedName,
      price,
      description,
      status: 'active'
    })
  } catch (err) {
    if (err.code === 11000) {
      fail('Dịch vụ đã tồn tại trong chi nhánh')
    }
    throw err;
  }
}

// Cập nhật thông tin dịch vụ
exports.updateService = async (id, data, branchId) => {
  const svc = await findBranchEntity(Service, id, branchId)
  if (!svc) fail('Dịch vụ không tồn tại', 404)

  const { name, price, description } = data

  if (name != null) {
    const trimmed = name.trim()
    if (!trimmed) fail('Tên dịch vụ không được để trống')
    // Kiểm tra trùng tên với Service khác trong cùng chi nhánh
    const dup = await Service.findOne({ branch: branchId, name: trimmed, _id: { $ne: id } })
    if (dup) fail('Dịch vụ đã tồn tại trong chi nhánh')
    svc.name = trimmed
  }

  if (price != null) {
    if (price <= 0) fail('Giá dịch vụ phải lớn hơn 0')
    svc.price = price
  }

  if (description !== undefined) svc.description = description

  try {
    return await svc.save()
  } catch (err) {
    if (err.code === 11000) {
      fail('Dịch vụ đã tồn tại trong chi nhánh')
    }
    throw err
  }
}

// Đổi trạng thái dịch vụ sang inactive (Deactivate)
exports.deactivateService = async (id, branchId) => {
  const svc = await findBranchEntity(Service, id, branchId)
  if (!svc) fail('Dịch vụ không tồn tại', 404)

  svc.status = 'inactive'
  return svc.save()
}

// ─── RoomIssue (CRUD & Workflow - UC70) ──────────────────────────────────────────

// Lấy danh sách sự cố phòng của chi nhánh
exports.getRoomIssues = async (branchId, query = {}) => {
  const filter = { branch: branchId }

  if (query.status) {
    if (['open', 'maintaining', 'fix_requested', 'resolved', 'cancelled'].includes(query.status)) {
      filter.status = query.status
    }
  }
  if (query.room) {
    filter.room = query.room
  }
  if (query.severity) {
    if (['low', 'medium', 'high'].includes(query.severity)) {
      filter.severity = query.severity
    }
  }

  return RoomIssue.find(filter)
    .populate('room', 'roomNumber status')
    .populate('reporter', 'email')          // HK báo cần bảo trì
    .populate('fixRequestedBy', 'email')    // HK báo đã sửa (người sửa)
    .populate('resolvedBy', 'email')        // QL xác nhận
    .populate('cancelledBy', 'email')       // QL từ chối
    .sort({ createdAt: -1 })
}

// Lấy thông tin chi tiết sự cố phòng
exports.getRoomIssueById = async (id, branchId) => {
  const issue = await findBranchEntity(RoomIssue, id, branchId)
    .populate('room', 'roomNumber status')
    .populate('reporter', 'email')
    .populate('resolvedBy', 'email')

  if (!issue) fail('Sự cố không tồn tại', 404)
  return issue
}

// Tạo mới sự cố phòng
exports.createRoomIssue = async (data, branchId, reporterId) => {
  const { room: roomId, description, severity } = data

  if (!roomId) fail('ID phòng không được để trống')
  if (!description?.trim()) fail('Mô tả sự cố không được để trống')

  // Xác minh phòng thuộc chi nhánh và chưa bị xóa
  const room = await Room.findOne({ _id: roomId, branch: branchId, isDeleted: { $ne: true } })
  if (!room) fail('Phòng không tồn tại', 404)

  // Manager TỰ tạo -> vào thẳng 'maintaining' + phòng maintenance (manager là người duyệt)
  const issue = await RoomIssue.create({
    branch: branchId, room: roomId, reporter: reporterId,
    description: description.trim(), severity: severity || 'medium',
    status: 'maintaining', approvedBy: reporterId, approvedAt: new Date(),
  })
  if (room.status !== 'occupied') { room.status = 'maintenance'; await room.save() }
  return issue
}

// QL DUYỆT yêu cầu bảo trì của HK: open -> maintaining + phòng maintenance + báo HK.
exports.approveMaintenance = async (id, branchId, managerId) => {
  const issue = await findBranchEntity(RoomIssue, id, branchId)
  if (!issue) fail('Yêu cầu bảo trì không tồn tại', 404)
  if (issue.status !== 'open') fail('Chỉ duyệt yêu cầu đang chờ duyệt')
  issue.status = 'maintaining'; issue.approvedBy = managerId; issue.approvedAt = new Date()
  await issue.save()
  const room = await findBranchEntity(Room, issue.room, branchId)
  if (room && room.status !== 'occupied') { room.status = 'maintenance'; await room.save() }
  try {
    await notificationService.notifyUser(issue.reporter, {
      type: 'general', title: `Đã duyệt bảo trì phòng ${room?.roomNumber || ''}`,
      body: 'Quản lý đã duyệt — phòng chuyển sang bảo trì.', refType: 'room', refId: issue.room, branch: branchId,
    })
  } catch { /* ignore */ }
  return issue
}

// Còn yêu cầu bảo trì nào đang hoạt động không -> nếu hết thì mở lại phòng.
async function reopenRoomIfClear(roomId, branchId) {
  const active = await RoomIssue.countDocuments({ room: roomId, status: { $in: ['open', 'maintaining', 'fix_requested'] } })
  if (active === 0) {
    const room = await findBranchEntity(Room, roomId, branchId)
    if (room && room.status === 'maintenance') { room.status = 'available'; await room.save() }
  }
}

// QL XÁC NHẬN đã sửa: maintaining/fix_requested -> resolved + mở lại phòng + báo HK.
exports.resolveRoomIssue = async (id, data, branchId, managerId) => {
  const issue = await findBranchEntity(RoomIssue, id, branchId)
  if (!issue) fail('Sự cố không tồn tại', 404)
  if (!['maintaining', 'fix_requested'].includes(issue.status)) fail('Chỉ xác nhận đã sửa cho phòng đang bảo trì')
  issue.status = 'resolved'
  issue.resolvedBy = managerId
  issue.resolvedAt = new Date()
  issue.resolutionNote = data?.resolutionNote?.trim() || issue.resolutionNote || ''
  await issue.save()
  await reopenRoomIfClear(issue.room, branchId)
  try {
    await notificationService.notifyUser(issue.reporter, {
      type: 'general', title: 'Phòng đã được xác nhận sửa xong',
      body: 'Quản lý đã xác nhận — phòng được mở lại.', refType: 'room', refId: issue.room, branch: branchId,
    })
  } catch { /* ignore */ }
  return issue
}

// QL TỪ CHỐI / huỷ yêu cầu: open/maintaining/fix_requested -> cancelled (mở lại phòng nếu đang bảo trì) + báo HK.
exports.cancelRoomIssue = async (id, data, branchId, managerId) => {
  const issue = await findBranchEntity(RoomIssue, id, branchId)
  if (!issue) fail('Sự cố không tồn tại', 404)
  if (!['open', 'maintaining', 'fix_requested'].includes(issue.status)) fail('Chỉ huỷ yêu cầu chưa kết thúc')
  issue.status = 'cancelled'
  issue.cancelledBy = managerId
  issue.cancelledAt = new Date()
  issue.cancellationReason = data?.cancellationReason?.trim() || ''
  await issue.save()
  await reopenRoomIfClear(issue.room, branchId)
  try {
    await notificationService.notifyUser(issue.reporter, {
      type: 'general', title: 'Yêu cầu bảo trì bị từ chối',
      body: issue.cancellationReason || 'Quản lý đã từ chối yêu cầu bảo trì.', refType: 'room', refId: issue.room, branch: branchId,
    })
  } catch { /* ignore */ }
  return issue
}

// Báo cáo sự cố phòng phát sinh từ Housekeeping Task
exports.createRoomIssueFromTask = async (taskId, data, branchId, reporterId) => {
  const { description, severity } = data

  if (!description?.trim()) fail('Mô tả sự cố không được để trống')

  // Tìm task dọn phòng và cô lập theo chi nhánh
  const task = await findBranchEntity(HousekeepingTask, taskId, branchId)
  if (!task) fail('Công việc dọn phòng không tồn tại', 404)

  // Kiểm tra trùng lặp sự cố đang mở cùng mô tả cho task này
  const exists = await RoomIssue.exists({
    housekeepingTask: taskId,
    status: 'open',
    description: description.trim()
  })
  if (exists) {
    fail('Sự cố này đã được báo cáo và đang chờ xử lý')
  }

  // Xác minh phòng thuộc chi nhánh và chưa bị xóa
  const room = await Room.findOne({ _id: task.room, branch: branchId, isDeleted: { $ne: true } })
  if (!room) fail('Phòng không tồn tại', 404)

  // Manager tạo từ task -> maintaining luôn + phòng maintenance
  const issue = await RoomIssue.create({
    branch: branchId, room: task.room, reporter: reporterId,
    description: description.trim(), severity: severity || 'medium',
    status: 'maintaining', approvedBy: reporterId, approvedAt: new Date(), housekeepingTask: taskId,
  })
  if (room.status !== 'occupied') { room.status = 'maintenance'; await room.save() }
  task.issueNote = task.issueNote ? `${task.issueNote}\n- ${description.trim()}` : description.trim()
  await task.save()
  return issue
}

// ─── Housekeeping Monitor (UC69) ──────────────────────────────────────────────────

// Lấy danh sách công việc dọn phòng của chi nhánh
exports.getHousekeepingTasks = async (branchId, query = {}) => {
  const filter = { branch: branchId }

  if (query.status) {
    if (HousekeepingTask.TASK_STATUS.includes(query.status)) {
      filter.status = query.status
    }
  }

  if (query.assignedTo !== undefined) {
    filter.assignedTo = query.assignedTo === 'null' ? null : query.assignedTo
  }

  if (query.room) {
    filter.room = query.room
  }

  return HousekeepingTask.find(filter)
    .populate('room', 'roomNumber status')
    .populate('assignedTo', 'email')
    .populate('assignedBy', 'email')
    .sort({ isUrgent: -1, createdAt: 1 })
}

// Xem chi tiết công việc dọn phòng
exports.getHousekeepingTaskById = async (id, branchId) => {
  const task = await findBranchEntity(HousekeepingTask, id, branchId)
    .populate('room', 'roomNumber status')
    .populate('assignedTo', 'email')
    .populate('assignedBy', 'email')
    .populate('booking')

  if (!task) fail('Công việc dọn phòng không tồn tại', 404)
  return task
}

// Phân công công việc dọn phòng cho housekeeper (Reassign/Option A)
exports.assignHousekeepingTask = async (id, assignedToAccountId, branchId, managerId) => {
  const task = await findBranchEntity(HousekeepingTask, id, branchId)
  if (!task) fail('Công việc dọn phòng không tồn tại', 404)

  // Chặn phân công cho task đã kết thúc
  if (['completed', 'missed'].includes(task.status)) {
    fail('Không thể phân công task đã kết thúc')
  }

  if (assignedToAccountId) {
    // Chặn phân công cho chính quản lý
    if (String(assignedToAccountId) === String(managerId)) {
      fail('Không thể phân công task cho quản lý')
    }

    // Kiểm tra tài khoản housekeeper tồn tại và active
    const housekeeperAcc = await Account.findOne({ _id: assignedToAccountId, isActive: true })
    if (!housekeeperAcc) fail('Tài khoản nhân viên không tồn tại hoặc bị khóa')

    // Kiểm tra RoleAssignment active, đúng role 'housekeeper' và đúng chi nhánh
    const roleAssign = await RoleAssignment.findOne({
      account: assignedToAccountId,
      branch: branchId,
      role: 'housekeeper',
      isActive: true
    })
    if (!roleAssign) fail('Nhân viên dọn phòng không hợp lệ hoặc không thuộc chi nhánh này')

    task.assignedTo = assignedToAccountId
    task.assignedBy = managerId
    task.assignedAt = new Date()
  } else {
    // Unassign task
    task.assignedTo = null
    task.assignedBy = null
    task.assignedAt = null
  }

  const saved = await task.save()

  // Báo cho housekeeper được phân công (đặc biệt với task đã escalated, chỉ manager gán được)
  if (assignedToAccountId) {
    const room = await Room.findById(task.room).select('roomNumber').lean()
    try {
      await notificationService.notifyUser(assignedToAccountId, {
        type: 'task_new', title: `Bạn được giao việc phòng ${room?.roomNumber || ''}`,
        body: 'Quản lý vừa phân công việc này cho bạn.', refType: 'task', refId: task._id, branch: branchId,
      })
    } catch (e) { /* notify lỗi không chặn nghiệp vụ */ }
  }

  return saved
}

// Đánh dấu/bỏ đánh dấu khẩn cấp cho task dọn phòng
exports.markHousekeepingTaskUrgent = async (id, branchId) => {
  const task = await findBranchEntity(HousekeepingTask, id, branchId)
  if (!task) fail('Công việc dọn phòng không tồn tại', 404)

  task.isUrgent = !task.isUrgent
  return task.save()
}

// Lấy danh sách housekeeper thuộc chi nhánh
exports.getHousekeepers = async (branchId) => {
  const assignments = await RoleAssignment.find({
    branch: branchId,
    role: 'housekeeper',
    isActive: true
  }).populate('account', '_id email fullName isActive')

  return assignments
    .map(a => a.account)
    .filter(acc => acc && acc.isActive)
}

// ─── Phân tầng housekeeper ───────────────────────────────────────────────────────
// Danh sách housekeeper kèm tầng phụ trách (cho màn phân tầng + banner "chưa phân tầng")
exports.getHousekeeperFloors = async (branchId) => {
  const ras = await RoleAssignment.find({ branch: branchId, role: 'housekeeper', isActive: true })
    .populate('account', '_id email fullName isActive').lean()
  return ras
    .filter(r => r.account && r.account.isActive !== false)
    .map(r => ({ account: r.account, floors: r.floors || [] }))
}

// Set tầng phụ trách cho 1 housekeeper (accountId) trong chi nhánh
exports.setHousekeeperFloors = async (accountId, floors, branchId) => {
  if (!Array.isArray(floors)) fail('Danh sách tầng không hợp lệ')
  const clean = [...new Set(floors.map(f => Number(f)).filter(f => Number.isFinite(f) && f >= 0))].sort((a, b) => a - b)
  const ra = await RoleAssignment.findOneAndUpdate(
    { account: accountId, branch: branchId, role: 'housekeeper', isActive: true },
    { $set: { floors: clean } }, { new: true }
  ).populate('account', '_id email fullName')
  if (!ra) fail('Nhân viên buồng phòng không thuộc chi nhánh', 404)
  return { account: ra.account, floors: ra.floors || [] }
}





