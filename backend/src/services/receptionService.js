// Owner: Quốc — Receptionist read logic (UC-26/27/28/43). Scope theo chi nhánh được gán (BR-30).
const Booking = require('../models/bookingModel')
const Room = require('../models/roomModel')
const Payment = require('../models/paymentModel')
const BookingStatusHistory = require('../models/bookingStatusHistoryModel')
const RoleAssignment = require('../models/roleAssignmentModel')

// Các branchId mà lễ tân được gán (BR-30: chỉ quản lý chi nhánh của mình)
async function myBranchIds(accountId) {
  const ras = await RoleAssignment.find({ account: accountId, role: 'receptionist', isActive: true }).select('branch -_id')
  const ids = ras.map((r) => r.branch)
  if (!ids.length) throw new Error('Tài khoản chưa được gán chi nhánh')
  return ids
}
exports.myBranchIds = myBranchIds

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
  if (!booking) throw new Error('Không tìm thấy booking trong chi nhánh của bạn')
  const payments = await Payment.find({ booking: bookingId }).sort('createdAt').lean()
  const history = await BookingStatusHistory.find({ booking: bookingId }).sort('createdAt').lean()
  return { booking, payments, history }
}
