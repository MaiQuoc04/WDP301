// Owner: Quốc — Receptionist read logic (UC-26/27/28/43). Scope theo chi nhánh được gán (BR-30).
const Booking = require('../models/bookingModel')
const Room = require('../models/roomModel')
const Payment = require('../models/paymentModel')
const BookingStatusHistory = require('../models/bookingStatusHistoryModel')
const RoleAssignment = require('../models/roleAssignmentModel')
const Service = require('../models/serviceModel')
const Amenity = require('../models/amenityModel')
const bookingService = require('./bookingService')

// Các branchId mà lễ tân được gán (BR-30: chỉ quản lý chi nhánh của mình)
async function myBranchIds(accountId) {
  const ras = await RoleAssignment.find({ account: accountId, role: 'receptionist', isActive: true }).select('branch -_id')
  const ids = ras.map((r) => r.branch)
  if (!ids.length) throw new Error('Tài khoản chưa được gán chi nhánh')
  return ids
}
exports.myBranchIds = myBranchIds

// Danh mục dịch vụ / thiết bị của chi nhánh (cho dropdown bill)
exports.listServices = async (accountId) => {
  const branches = await myBranchIds(accountId)
  return Service.find({ branch: { $in: branches }, status: 'active' }).sort('name').lean()
}
exports.listAmenities = async (accountId) => {
  const branches = await myBranchIds(accountId)
  return Amenity.find({ branch: { $in: branches }, status: 'active' }).sort('name').lean()
}

// UC-26: danh sách phòng + trạng thái trong chi nhánh
exports.listRooms = async (accountId, { status } = {}) => {
  const branches = await myBranchIds(accountId)
  const q = { branch: { $in: branches } }
  if (status) q.status = status
  return Room.find(q).populate('roomType', 'name basePrice capacity').sort('roomNumber').lean()
}

// UC-27/43: danh sách + lọc booking (status, ngày check-in, từ khoá mã/tên/sđt)
exports.listBookings = async (accountId, { status, date, q } = {}) => {
  const branches = await myBranchIds(accountId)
  const filter = { branch: { $in: branches } }
  if (status) filter.status = status
  if (date) {
    const d0 = new Date(date); d0.setHours(0, 0, 0, 0)
    filter.checkIn = { $gte: d0, $lt: new Date(d0.getTime() + 86400000) }
  }
  if (q) filter.$or = [
    { code: new RegExp(q, 'i') },
    { guestName: new RegExp(q, 'i') },
    { guestPhone: new RegExp(q, 'i') },
  ]
  return Booking.find(filter)
    .populate('roomType', 'name')
    .populate('room', 'roomNumber')
    .populate({ path: 'customer', select: 'fullName phone' })
    .sort('-createdAt').lean()
}

// UC-28: chi tiết booking (dữ liệu cho màn 3 tab: thông tin / thiết bị / bill)
exports.getBookingDetail = async (accountId, bookingId) => {
  const branches = await myBranchIds(accountId)
  const booking = await Booking.findOne({ _id: bookingId, branch: { $in: branches } })
    .populate('roomType', 'name basePrice')
    .populate('room', 'roomNumber floor')
    .populate({ path: 'customer', select: 'fullName phone idCard' })
    .lean()
  if (!booking) { const e = new Error('Không tìm thấy booking trong chi nhánh của bạn'); e.status = 404; throw e }
  const payments = await Payment.find({ booking: bookingId }).sort('createdAt').lean()
  const history = await BookingStatusHistory.find({ booking: bookingId }).sort('createdAt').lean()
  return { booking, payments, history }
}

// Đảm bảo booking thuộc chi nhánh của lễ tân trước khi thao tác (BR-30)
async function assertInBranch(accountId, bookingId) {
  const branches = await myBranchIds(accountId)
  const ok = await Booking.exists({ _id: bookingId, branch: { $in: branches } })
  if (!ok) { const e = new Error('Không tìm thấy booking trong chi nhánh của bạn'); e.status = 404; throw e }
}

// ---------- GĐ2: thao tác vòng đời (scope branch + ủy quyền cho bookingService) ----------
// UC-29: tạo booking tại quầy (walk-in)
// Tìm phòng cụ thể còn trống + hợp party (cho form walk-in bước 2)
exports.searchRooms = async (accountId, q = {}) => {
  const branches = await myBranchIds(accountId)
  if (!q.checkIn || !q.checkOut) throw new Error('Thiếu ngày nhận/trả')
  return bookingService.searchAvailableRooms(
    branches[0], q.checkIn, q.checkOut,
    Number(q.adults) || 1, Number(q.children) || 0,
    { roomTypeId: q.roomTypeId || undefined }
  )
}

// UC-29: walk-in — lễ tân chọn PHÒNG cụ thể + dịch vụ kèm
exports.walkIn = async (accountId, body) => {
  const branches = await myBranchIds(accountId)
  return bookingService.create({
    branchId: branches[0],
    roomId: body.roomId,
    guestName: body.guestName, guestPhone: body.guestPhone,
    checkIn: body.checkIn, checkOut: body.checkOut,
    adults: body.adults, children: body.children,
    services: body.services,
    source: 'walk_in', createdBy: accountId,
  })
}
exports.confirmDeposit = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.confirmDeposit(bookingId, { method: body.method, transactionCode: body.transactionCode, by: accountId })
}
exports.checkIn = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.checkIn(bookingId, { by: accountId })
}
exports.checkOut = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.checkOut(bookingId, { method: body.method, by: accountId })
}
exports.complete = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.complete(bookingId, { by: accountId })
}
exports.setBedSurcharge = async (accountId, bookingId, apply) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.setBedSurcharge(bookingId, apply, accountId)
}

// ---------- GĐ3: Bill ----------
exports.addService = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.addExtraService(bookingId, body.serviceId, body.quantity, accountId)
}
exports.removeService = async (accountId, bookingId, lineId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.removeExtraService(bookingId, lineId, accountId)
}
exports.addMissingAmenity = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.addMissingAmenity(bookingId, body.amenityId, body.quantity, accountId)
}
exports.removeMissingAmenity = async (accountId, bookingId, lineId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.removeMissingAmenity(bookingId, lineId, accountId)
}
exports.getBill = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.getBill(bookingId)
}

// ---------- GĐ4: huỷ / no-show ----------
exports.cancel = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.cancel(bookingId, { reason: body.reason, by: accountId })
}
exports.markNoShow = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.markNoShow(bookingId, { by: accountId })
}
exports.transfer = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.transferRoom(bookingId, { newRoomId: body.newRoomId, by: accountId })
}
exports.update = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.updateBooking(bookingId, { ...body, by: accountId })
}

// ---------- GĐ5: lịch phòng + giao dịch ----------
// UC-39/40: lịch/timeline phòng — từng phòng kèm các booking đã gán (checked_in trở đi) trong khoảng
exports.getSchedule = async (accountId, { from, to } = {}) => {
  const branches = await myBranchIds(accountId)
  const start = from ? new Date(from) : new Date()
  const end = to ? new Date(to) : new Date(start.getTime() + 7 * 86400000)
  const rooms = await Room.find({ branch: { $in: branches } }).populate('roomType', 'name').sort('roomNumber').lean()
  const bookings = await Booking.find({
    branch: { $in: branches },
    room: { $ne: null },
    status: { $in: ['checked_in', 'checked_out', 'completed'] },
    checkIn: { $lt: end }, checkOut: { $gt: start },
  }).select('code guestName checkIn checkOut status room').lean()
  const byRoom = {}
  bookings.forEach((b) => { const k = String(b.room); (byRoom[k] = byRoom[k] || []).push(b) })
  return { from: start, to: end, rooms: rooms.map((r) => ({ ...r, bookings: byRoom[String(r._id)] || [] })) }
}

// UC-41: danh sách giao dịch trong chi nhánh (lọc status/type/khoảng ngày)
exports.listTransactions = async (accountId, { status, type, from, to } = {}) => {
  const branches = await myBranchIds(accountId)
  const bookingIds = await Booking.find({ branch: { $in: branches } }).distinct('_id')
  const q = { booking: { $in: bookingIds } }
  if (status) q.status = status
  if (type) q.type = type
  if (from || to) {
    q.createdAt = {}
    if (from) q.createdAt.$gte = new Date(from)
    if (to) q.createdAt.$lte = new Date(to)
  }
  return Payment.find(q).populate('booking', 'code guestName').sort('-createdAt').lean()
}

// UC-42: chi tiết giao dịch
exports.getTransaction = async (accountId, paymentId) => {
  const branches = await myBranchIds(accountId)
  const payment = await Payment.findById(paymentId).populate('booking', 'code guestName branch totalAmount paidAmount').lean()
  if (!payment || !payment.booking || !branches.some((b) => String(b) === String(payment.booking.branch))) {
    const e = new Error('Không tìm thấy giao dịch trong chi nhánh của bạn'); e.status = 404; throw e
  }
  return payment
}
