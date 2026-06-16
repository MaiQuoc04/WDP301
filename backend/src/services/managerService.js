// Owner: Hoàng — Branch Manager service layer (UC-57→62 + RoomPrice)
// Toàn bộ hàm nhận branchId từ req.branchId (do middleware getBranchManagerBranch gán).
// KHÔNG bao giờ tin body.branchId từ client — chỉ dùng branchId từ tham số hàm.
const RoomType  = require('../models/roomTypeModel')
const Room      = require('../models/roomModel')
const RoomPrice = require('../models/roomPriceModel')
const Booking   = require('../models/bookingModel')
const Amenity   = require('../models/amenityModel')

// ─── Helper ──────────────────────────────────────────────────────────────────
// Ném lỗi với HTTP status code (controller sẽ bắt và trả về client)
function fail(msg, code = 400) {
  const e = new Error(msg)
  e.status = code
  throw e
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
  return RoomType.find({ branch: branchId, status: 'active' }, '_id name bedType capacity basePrice').sort({ name: 1 })
}

// Chi tiết 1 RoomType (chặn xem chéo chi nhánh)
exports.getRoomTypeById = async (id, branchId) => {
  const rt = await RoomType.findOne({ _id: id, branch: branchId })
  if (!rt) fail('Loại phòng không tồn tại', 404)
  return rt
}

// UC-57: Tạo mới RoomType
exports.createRoomType = async (data, branchId) => {
  const { name, bedType, capacity, area, basePrice, description, images } = data

  if (!name?.trim()) fail('Tên loại phòng không được để trống')
  if (!basePrice || basePrice <= 0) fail('Giá cơ bản phải lớn hơn 0')
  if (capacity != null && capacity <= 0) fail('Sức chứa phải lớn hơn 0')

  // Kiểm tra trùng tên trong chi nhánh
  const exists = await RoomType.findOne({ branch: branchId, name: name.trim() })
  if (exists) fail(`Loại phòng "${name.trim()}" đã tồn tại trong chi nhánh`)

  return RoomType.create({ branch: branchId, name: name.trim(), bedType, capacity, area, basePrice, description, images })
}

// UC-58: Cập nhật RoomType
exports.updateRoomType = async (id, data, branchId) => {
  const rt = await RoomType.findOne({ _id: id, branch: branchId })
  if (!rt) fail('Loại phòng không tồn tại', 404)

  const { name, bedType, capacity, area, basePrice, description, images } = data

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
  if (bedType != null) rt.bedType = bedType
  if (area != null) rt.area = area
  if (description != null) rt.description = description
  if (images != null) rt.images = images

  return rt.save()
}

// UC-59: Đổi trạng thái RoomType (active ↔ inactive) — Soft delete khi inactive
exports.updateRoomTypeStatus = async (id, status, branchId) => {
  const rt = await RoomType.findOne({ _id: id, branch: branchId })
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
  const rt = await RoomType.findOne({ _id: roomTypeId, branch: branchId })
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
    const rt = await RoomType.findOne({ _id: roomTypeId, branch: branchId })
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
    .sort({ roomType: 1, date: 1 })
}

// Tạo hoặc cập nhật cấu hình giá động (upsert)
exports.createOrUpdateRoomPrice = async (data, branchId) => {
  const { roomType: roomTypeId, date, dayType, price, discount } = data

  if (!roomTypeId) fail('Loại phòng không được để trống')
  if (!price || price <= 0) fail('Giá phải lớn hơn 0')
  if (!date && !dayType) fail('Phải chỉ định ngày cụ thể (date) hoặc loại ngày (dayType)')
  if (date && dayType) fail('Chỉ được chỉ định 1 trong 2: ngày cụ thể (date) hoặc loại ngày (dayType)')

  // Đảm bảo roomType thuộc chi nhánh
  const rt = await RoomType.findOne({ _id: roomTypeId, branch: branchId })
  if (!rt) fail('Loại phòng không tồn tại hoặc không thuộc chi nhánh này', 404)

  if (date) {
    const targetDate = new Date(date)
    if (isNaN(targetDate)) fail('Ngày không hợp lệ')
    // Cấu hình theo ngày cụ thể → upsert theo roomType + date
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0)
    const endOfDay   = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999)
    return RoomPrice.findOneAndUpdate(
      { roomType: roomTypeId, date: { $gte: startOfDay, $lte: endOfDay } },
      { roomType: roomTypeId, date: startOfDay, price, discount: discount || 0, dayType: undefined },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  } else {
    const validDayTypes = ['weekday', 'weekend', 'holiday']
    if (!validDayTypes.includes(dayType)) fail(`dayType không hợp lệ. Cho phép: ${validDayTypes.join(', ')}`)
    // Cấu hình theo loại ngày → upsert theo roomType + dayType
    return RoomPrice.findOneAndUpdate(
      { roomType: roomTypeId, dayType, date: null },
      { roomType: roomTypeId, dayType, price, discount: discount || 0, date: undefined },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
  const am = await Amenity.findOne({ _id: id, branch: branchId })
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

// Đổi trạng thái tiện nghi thành inactive (Deactivate) và tự động gỡ khỏi RoomTypes
exports.deactivateAmenity = async (id, branchId) => {
  const am = await Amenity.findOne({ _id: id, branch: branchId })
  if (!am) fail('Tiện nghi không tồn tại', 404)

  am.status = 'inactive'
  await am.save()

  // Tự động gỡ tiện nghi này ra khỏi mảng amenities của mọi RoomType trong chi nhánh
  await RoomType.updateMany(
    { branch: branchId },
    { $pull: { amenities: id } }
  )

  return am
}

// ─── RoomType Amenities mapping ────────────────────────────────────────────────

// Lấy danh sách tiện nghi của một RoomType cụ thể
exports.getRoomTypeAmenities = async (roomTypeId, branchId) => {
  const rt = await RoomType.findOne({ _id: roomTypeId, branch: branchId })
    .populate('amenities', 'name missingPrice unit status')
  if (!rt) fail('Loại phòng không tồn tại', 404)

  return rt.amenities
}

// Cập nhật danh sách tiện nghi cho một RoomType
exports.updateRoomTypeAmenities = async (roomTypeId, amenityIds, branchId) => {
  const rt = await RoomType.findOne({ _id: roomTypeId, branch: branchId })
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


