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
const Account = require('../models/accountModel')

const supportsTransactions = process.env.ENABLE_TRANSACTIONS === 'true'

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
  const rt = await findBranchEntity(RoomType, id, branchId)
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
  const rt = await findBranchEntity(RoomType, id, branchId)
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
    const rt = await findBranchEntity(RoomType, roomTypeId, branchId)
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
    if (['open', 'resolved'].includes(query.status)) {
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
    .populate('reporter', 'email')
    .populate('resolvedBy', 'email')
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

  const issue = await RoomIssue.create({
    branch: branchId,
    room: roomId,
    reporter: reporterId,
    description: description.trim(),
    severity: severity || 'medium',
    status: 'open'
  })

  // Cập nhật trạng thái phòng: 'available' hoặc 'cleaning' chuyển thành 'maintenance'
  // Không ghi đè nếu phòng đang 'occupied' (khách đang ở)
  if (['available', 'cleaning'].includes(room.status)) {
    room.status = 'maintenance'
    await room.save()
  }

  return issue
}

// Giải quyết sự cố phòng
exports.resolveRoomIssue = async (id, data, branchId, managerId) => {
  const { resolutionNote } = data

  if (supportsTransactions) {
    let session
    try {
      session = await mongoose.startSession()
      session.startTransaction()
      const issue = await RoomIssue.findOne({ _id: id, branch: branchId }).session(session)
      if (!issue) fail('Sự cố không tồn tại', 404)

      if (issue.status !== 'open') {
        fail('Chỉ có thể giải quyết sự cố đang mở')
      }

      issue.status = 'resolved'
      issue.resolvedBy = managerId
      issue.resolvedAt = new Date()
      issue.resolutionNote = resolutionNote?.trim() || ''
      await issue.save({ session })

      // Kiểm tra xem phòng còn sự cố nào khác đang mở không
      const openCount = await RoomIssue.countDocuments({ room: issue.room, status: 'open' }).session(session)
      if (openCount === 0) {
        const room = await Room.findOne({ _id: issue.room, branch: branchId }).session(session)
        if (room && room.status === 'maintenance') {
          room.status = 'available'
          await room.save({ session })
        }
      }

      await session.commitTransaction()
      session.endSession()
      return issue
    } catch (error) {
      if (session) {
        if (session.inTransaction()) {
          await session.abortTransaction()
        }
        session.endSession()
      }
      if (error.message.includes('replica set') || error.message.includes('transaction') || error.message.includes('Session') || error.codeName === 'InvalidOptions') {
        throw new Error('Transactions are enabled but MongoDB does not support them')
      }
      throw error
    }
  } else {
    const issue = await findBranchEntity(RoomIssue, id, branchId)
    if (!issue) fail('Sự cố không tồn tại', 404)

    if (issue.status !== 'open') {
      fail('Chỉ có thể giải quyết sự cố đang mở')
    }

    issue.status = 'resolved'
    issue.resolvedBy = managerId
    issue.resolvedAt = new Date()
    issue.resolutionNote = resolutionNote?.trim() || ''
    await issue.save()

    // Kiểm tra xem phòng còn sự cố nào khác đang mở không
    const openCount = await RoomIssue.countDocuments({ room: issue.room, status: 'open' })
    if (openCount === 0) {
      const room = await findBranchEntity(Room, issue.room, branchId)
      if (room && room.status === 'maintenance') {
        room.status = 'available'
        await room.save()
      }
    }

    return issue
  }
}

// Hủy bỏ sự cố phòng (Cancelled status)
exports.cancelRoomIssue = async (id, data, branchId, managerId) => {
  const { cancellationReason } = data

  if (supportsTransactions) {
    let session
    try {
      session = await mongoose.startSession()
      session.startTransaction()
      const issue = await RoomIssue.findOne({ _id: id, branch: branchId }).session(session)
      if (!issue) fail('Sự cố không tồn tại', 404)

      if (issue.status !== 'open') {
        fail('Chỉ có thể hủy sự cố đang mở')
      }

      issue.status = 'cancelled'
      issue.cancelledBy = managerId
      issue.cancelledAt = new Date()
      issue.cancellationReason = cancellationReason?.trim() || ''
      await issue.save({ session })

      // Kiểm tra xem phòng còn sự cố nào khác đang mở không
      const openCount = await RoomIssue.countDocuments({ room: issue.room, status: 'open' }).session(session)
      if (openCount === 0) {
        const room = await Room.findOne({ _id: issue.room, branch: branchId }).session(session)
        if (room && room.status === 'maintenance') {
          room.status = 'available'
          await room.save({ session })
        }
      }

      await session.commitTransaction()
      session.endSession()
      return issue
    } catch (error) {
      if (session) {
        if (session.inTransaction()) {
          await session.abortTransaction()
        }
        session.endSession()
      }
      if (error.message.includes('replica set') || error.message.includes('transaction') || error.message.includes('Session') || error.codeName === 'InvalidOptions') {
        throw new Error('Transactions are enabled but MongoDB does not support them')
      }
      throw error
    }
  } else {
    const issue = await findBranchEntity(RoomIssue, id, branchId)
    if (!issue) fail('Sự cố không tồn tại', 404)

    if (issue.status !== 'open') {
      fail('Chỉ có thể hủy sự cố đang mở')
    }

    issue.status = 'cancelled'
    issue.cancelledBy = managerId
    issue.cancelledAt = new Date()
    issue.cancellationReason = cancellationReason?.trim() || ''
    await issue.save()

    // Kiểm tra xem phòng còn sự cố nào khác đang mở không
    const openCount = await RoomIssue.countDocuments({ room: issue.room, status: 'open' })
    if (openCount === 0) {
      const room = await findBranchEntity(Room, issue.room, branchId)
      if (room && room.status === 'maintenance') {
        room.status = 'available'
        await room.save()
      }
    }

    return issue
  }
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

  if (supportsTransactions) {
    let session
    try {
      session = await mongoose.startSession()
      session.startTransaction()
      const issue = await RoomIssue.create([{
        branch: branchId,
        room: task.room,
        reporter: reporterId,
        description: description.trim(),
        severity: severity || 'medium',
        status: 'open',
        housekeepingTask: taskId
      }], { session }).then(res => res[0])

      // Cập nhật trạng thái phòng: 'available' hoặc 'cleaning' chuyển thành 'maintenance'
      if (['available', 'cleaning'].includes(room.status)) {
        room.status = 'maintenance'
        await room.save({ session })
      }

      // Nối thêm/cập nhật issueNote của task dọn dẹp
      if (task.issueNote) {
        task.issueNote = `${task.issueNote}\n- ${description.trim()}`
      } else {
        task.issueNote = description.trim()
      }
      await task.save({ session })

      await session.commitTransaction()
      session.endSession()
      return issue
    } catch (error) {
      if (session) {
        if (session.inTransaction()) {
          await session.abortTransaction()
        }
        session.endSession()
      }
      if (error.message.includes('replica set') || error.message.includes('transaction') || error.message.includes('Session') || error.codeName === 'InvalidOptions') {
        throw new Error('Transactions are enabled but MongoDB does not support them')
      }
      throw error
    }
  } else {
    const issue = await RoomIssue.create({
      branch: branchId,
      room: task.room,
      reporter: reporterId,
      description: description.trim(),
      severity: severity || 'medium',
      status: 'open',
      housekeepingTask: taskId
    })

    // Cập nhật trạng thái phòng: 'available' hoặc 'cleaning' chuyển thành 'maintenance'
    if (['available', 'cleaning'].includes(room.status)) {
      room.status = 'maintenance'
      await room.save()
    }

    // Nối thêm/cập nhật issueNote của task dọn dẹp
    if (task.issueNote) {
      task.issueNote = `${task.issueNote}\n- ${description.trim()}`
    } else {
      task.issueNote = description.trim()
    }
    await task.save()

    return issue
  }
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

  return task.save()
}

// Đánh dấu/bỏ đánh dấu khẩn cấp cho task dọn phòng
exports.markHousekeepingTaskUrgent = async (id, branchId) => {
  const task = await findBranchEntity(HousekeepingTask, id, branchId)
  if (!task) fail('Công việc dọn phòng không tồn tại', 404)

  task.isUrgent = !task.isUrgent
  return task.save()
}




