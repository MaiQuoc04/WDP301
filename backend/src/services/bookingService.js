// Owner: Quốc — HỢP ĐỒNG LIÊN-MODULE. Khánh (booking online) gọi create().
// Nguồn sự thật cho vòng đời booking. Status/flow theo docs/STATUS_WORKFLOW_SPEC.md.
const Booking = require('../models/bookingModel')
const HoldRoom = require('../models/holdRoomModel')
const Room = require('../models/roomModel')
const Branch = require('../models/branchModel')
const RoomType = require('../models/roomTypeModel')
const RoomPrice = require('../models/roomPriceModel')
const BookingStatusHistory = require('../models/bookingStatusHistoryModel')
const Payment = require('../models/paymentModel')

const DAY = 24 * 60 * 60 * 1000
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const nightsBetween = (ci, co) => Math.round((startOfDay(co) - startOfDay(ci)) / DAY)

// Trạng thái booking đang "chiếm" phòng (BR-23)
const OCCUPYING = ['pending', 'confirmed', 'checked_in']

// Số phòng còn trống của 1 roomType trong khoảng [checkIn, checkOut)
// = tổng phòng - số booking đang chiếm trùng lịch (mỗi pending đã kèm 1 HoldRoom nên không đếm hold riêng để khỏi trùng).
async function countAvailableRooms(roomTypeId, branchId, checkIn, checkOut) {
  const totalRooms = await Room.countDocuments({ roomType: roomTypeId, branch: branchId })
  const overlap = await Booking.countDocuments({
    roomType: roomTypeId,
    status: { $in: OCCUPYING },
    checkIn: { $lt: checkOut },   // BR-23: newCheckIn < existCheckOut AND newCheckOut > existCheckIn
    checkOut: { $gt: checkIn },
  })
  return totalRooms - overlap
}
exports.countAvailableRooms = countAvailableRooms
exports.isRoomTypeAvailable = async (roomTypeId, branchId, checkIn, checkOut) =>
  (await countAvailableRooms(roomTypeId, branchId, checkIn, checkOut)) > 0

// Tính tiền phòng theo giá động (RoomPrice); fallback basePrice (UC tối ưu: docs §9.1)
async function computeRoomCharge(roomType, checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut)
  let total = 0
  for (let i = 0; i < nights; i++) {
    const day = startOfDay(new Date(startOfDay(checkIn).getTime() + i * DAY))
    const next = new Date(day.getTime() + DAY)
    let price = roomType.basePrice
    let discount = 0
    const byDate = await RoomPrice.findOne({ roomType: roomType._id, date: { $gte: day, $lt: next } })
    if (byDate) {
      price = byDate.price; discount = byDate.discount || 0
    } else {
      const isWeekend = [0, 6].includes(day.getDay())
      const byType = await RoomPrice.findOne({ roomType: roomType._id, dayType: isWeekend ? 'weekend' : 'weekday' })
      if (byType) { price = byType.price; discount = byType.discount || 0 }
    }
    total += price * (1 - discount / 100)
  }
  return Math.round(total)
}
exports.computeRoomCharge = computeRoomCharge

// Mô hình sức chứa theo "đơn vị": người lớn=1, trẻ em=0.5, mỗi giường=2 đơn vị.
// Người lớn phải vừa giường; trẻ vượt sức chứa -> phụ phí từng trẻ (giường phụ).
const ADULT_UNIT = 1, CHILD_UNIT = 0.5, BED_UNIT = 2
function computeOccupancy(roomType, adults = 1, children = 0) {
  const unitCapacity = (roomType.totalBeds || 1) * BED_UNIT
  const adultUnits = adults * ADULT_UNIT
  const fitsAdults = adultUnits <= unitCapacity
  const childrenThatFit = fitsAdults ? Math.floor((unitCapacity - adultUnits) / CHILD_UNIT) : 0
  const extraChildren = Math.max(0, children - childrenThatFit)
  return { unitCapacity, fitsAdults, childrenThatFit, extraChildren }
}
exports.computeOccupancy = computeOccupancy

// Báo giá 1 room type cho yêu cầu (Khánh dùng ở màn tìm phòng): tiền phòng + phụ phí giường phụ (/đêm).
exports.quote = async (roomType, checkIn, checkOut, adults = 1, children = 0) => {
  const nights = nightsBetween(checkIn, checkOut)
  const roomCharge = await computeRoomCharge(roomType, checkIn, checkOut)
  const occ = computeOccupancy(roomType, adults, children)
  const surcharge = occ.extraChildren * (roomType.extraChildFee || 0) * nights
  return { nights, roomCharge, extraChildren: occ.extraChildren, surcharge, total: roomCharge + surcharge, fitsAdults: occ.fitsAdults }
}

// Tính lại bill: total = phòng + dịch vụ + amenity thiếu + (phụ phí giường phụ nếu đã áp); remaining = total - đã trả - credit
function recalcBill(booking) {
  const surcharge = booking.bedSurchargeApplied ? (booking.bedSurcharge || 0) : 0
  booking.totalAmount = booking.roomCharge + (booking.extraServicesTotal || 0) + (booking.missingAmenitiesTotal || 0) + surcharge
  booking.remainingAmount = booking.totalAmount - (booking.paidAmount || 0) - (booking.creditApplied || 0)
  return booking
}
exports.recalcBill = recalcBill

async function genBookingCode(branchCode) {
  const year = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    const code = `${branchCode}-${year}-${Math.floor(100000 + Math.random() * 900000)}`
    if (!(await Booking.exists({ code }))) return code
  }
  throw new Error('Không sinh được mã booking, thử lại')
}

// Ghi log thay đổi status (BR-29)
async function logStatus(bookingId, from, to, by, note) {
  await BookingStatusHistory.create({ booking: bookingId, fromStatus: from, toStatus: to, changedBy: by, note })
}
exports.logStatus = logStatus

// Bảng chuyển trạng thái hợp lệ (docs/STATUS_WORKFLOW_SPEC.md §3)
const ALLOWED_TRANSITIONS = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['checked_in', 'cancelled', 'no_show'],
  checked_in:  ['checked_out'],
  checked_out: ['completed'],
  completed:   [], cancelled: [], no_show: [],
}
exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS

// Đổi status có kiểm tra hợp lệ + ghi log (BR-29). `booking` là document đã load.
exports.transition = async (booking, toStatus, by, note) => {
  const from = booking.status
  if (!ALLOWED_TRANSITIONS[from] || !ALLOWED_TRANSITIONS[from].includes(toStatus))
    throw new Error(`Không thể chuyển trạng thái ${from} → ${toStatus}`)
  booking.status = toStatus
  await booking.save()
  await logStatus(booking._id, from, toStatus, by, note)
  return booking
}

/**
 * Tạo booking + tính cọc theo depositRate của branch. Trạng thái 'pending'.
 * Dùng bởi: customer online (Khánh, source='online') và walk-in (Quốc, source='walk_in').
 * @param {Object} p
 * @param {string} p.branchId
 * @param {string} p.roomTypeId
 * @param {string} [p.customerId]  Customer._id (bắt buộc khi source='online')
 * @param {string} [p.guestName]   (bắt buộc khi source='walk_in')
 * @param {string} [p.guestPhone]
 * @param {Date|string} p.checkIn
 * @param {Date|string} p.checkOut
 * @param {number} [p.guests=1]
 * @param {'online'|'walk_in'} [p.source='online']
 * @param {string} [p.createdBy]   Account._id (lễ tân khi walk-in)
 * @returns {Promise<Booking>}
 */
exports.create = async (p) => {
  const source = p.source || 'online'
  const checkIn = startOfDay(p.checkIn)
  const checkOut = startOfDay(p.checkOut)

  // Validate (BR-26)
  if (!p.branchId || !p.roomTypeId) throw new Error('Thiếu branch hoặc loại phòng')
  if (!(checkIn instanceof Date) || isNaN(checkIn) || isNaN(checkOut)) throw new Error('Ngày không hợp lệ')
  if (nightsBetween(checkIn, checkOut) < 1) throw new Error('Phải ở tối thiểu 1 đêm (check-out > check-in)')
  if (checkIn < startOfDay(new Date())) throw new Error('Không thể đặt cho ngày trong quá khứ')
  if (source === 'online' && !p.customerId) throw new Error('Đặt online cần thông tin khách hàng')
  if (source === 'walk_in' && !p.guestName) throw new Error('Walk-in cần tên khách')

  const branch = await Branch.findById(p.branchId)
  if (!branch || !branch.isActive) throw new Error('Chi nhánh không tồn tại hoặc đã ngừng hoạt động')
  const roomType = await RoomType.findById(p.roomTypeId)
  if (!roomType || roomType.status !== 'active') throw new Error('Loại phòng không khả dụng')
  if (String(roomType.branch) !== String(branch._id)) throw new Error('Loại phòng không thuộc chi nhánh')

  // Sức chứa (mô hình đơn vị): người lớn phải vừa giường; trẻ vượt -> phụ phí (lễ tân tick sau)
  const adults = p.adults || 1
  const children = p.children || 0
  const occ = computeOccupancy(roomType, adults, children)
  if (!occ.fitsAdults) throw new Error('Số người lớn vượt sức chứa phòng, vui lòng chọn loại phòng lớn hơn')

  // Availability (BR-23)
  if ((await countAvailableRooms(roomType._id, branch._id, checkIn, checkOut)) <= 0)
    throw new Error('Hết phòng cho khoảng thời gian đã chọn')

  // Tính tiền
  const nights = nightsBetween(checkIn, checkOut)
  const roomCharge = await computeRoomCharge(roomType, checkIn, checkOut)
  const depositAmount = Math.round(branch.depositRate * roomCharge)
  const bedSurcharge = occ.extraChildren * (roomType.extraChildFee || 0) * nights // ước tính, chưa áp
  const totalAmount = roomCharge // phụ phí/dịch vụ cộng sau qua recalcBill
  const remainingAmount = totalAmount // chưa trả gì (paid 0)

  const booking = await Booking.create({
    code: await genBookingCode(branch.code),
    branch: branch._id,
    roomType: roomType._id,
    customer: source === 'online' ? p.customerId : undefined,
    guestName: p.guestName,
    guestPhone: p.guestPhone,
    checkIn, checkOut,
    guests: adults + children, adults, children,
    source,
    status: 'pending',
    paymentStatus: 'unpaid',
    roomCharge, depositAmount, totalAmount, remainingAmount, paidAmount: 0,
    bedSurcharge, bedSurchargeApplied: false,
    createdBy: p.createdBy,
  })

  // Giữ phòng tạm cho đặt online (hết hạn theo branch). TTL index tự xoá; cron sẽ cancel booking pending khi hết hạn.
  if (source === 'online') {
    await HoldRoom.create({
      roomType: roomType._id,
      customer: p.customerId,
      booking: booking._id,
      checkIn, checkOut,
      expiresAt: new Date(Date.now() + (branch.pendingTimeoutMinutes || 15) * 60 * 1000),
    })
  }

  await logStatus(booking._id, null, 'pending', p.createdBy, `Tạo booking (${source})`)
  return booking
}

// ---------- Vòng đời booking (GĐ2) ----------
async function loadBooking(bookingId) {
  const b = await Booking.findById(bookingId)
  if (!b) { const e = new Error('Booking không tồn tại'); e.status = 404; throw e }
  return b
}

// UC-18 (Khánh gọi sau webhook PayOS) / thu cọc tại quầy: pending -> confirmed
exports.confirmDeposit = async (bookingId, { method = 'online_qr', transactionCode, by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'pending') throw new Error('Chỉ booking đang chờ cọc mới xác nhận được')
  await Payment.create({
    booking: booking._id, type: 'deposit', method, amount: booking.depositAmount,
    status: 'paid', paidAt: new Date(), transactionCode, confirmedBy: by,
  })
  booking.paidAmount = booking.depositAmount
  booking.remainingAmount = booking.totalAmount - booking.paidAmount
  booking.paymentStatus = 'partial'
  await exports.transition(booking, 'confirmed', by, 'Đã thu cọc')
  await HoldRoom.deleteMany({ booking: booking._id }) // hết cần giữ tạm
  return booking
}

// UC-30: check-in -> gán phòng + occupied + sinh task dọn (Tú)
exports.checkIn = async (bookingId, { roomId, by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'confirmed') throw new Error('Chỉ booking đã xác nhận mới check-in được')
  let room
  if (roomId) {
    room = await Room.findOne({ _id: roomId, branch: booking.branch, roomType: booking.roomType })
    if (!room) throw new Error('Phòng không hợp lệ (sai chi nhánh/loại phòng)')
    if (['occupied', 'maintenance', 'locked'].includes(room.status)) throw new Error(`Phòng đang ${room.status}, không nhận được`)
  } else {
    room = await Room.findOne({ branch: booking.branch, roomType: booking.roomType, status: { $in: ['available', 'cleaning'] } }).sort('roomNumber')
    if (!room) throw new Error('Không còn phòng trống cùng loại để gán')
  }
  booking.room = room._id
  room.status = 'occupied'
  await room.save()
  await exports.transition(booking, 'checked_in', by, `Nhận phòng ${room.roomNumber}`)
  // Tự áp phụ phí giường phụ khi check-in (lễ tân có thể tắt sau qua setBedSurcharge)
  if (booking.bedSurcharge > 0 && !booking.bedSurchargeApplied) {
    booking.bedSurchargeApplied = true
    recalcBill(booking)
    await booking.save()
  }
  // 🔗 Hợp đồng Tú: sinh HousekeepingTask. Gọi defensive — không chặn check-in nếu Tú chưa cài.
  try { await require('./housekeepingService').createOnCheckIn(booking._id, room._id) }
  catch (e) { console.warn('[checkIn] createOnCheckIn chưa sẵn sàng:', e.message) }
  return booking
}

// UC-31: check-out -> thu remaining + room cleaning
exports.checkOut = async (bookingId, { method = 'cash', by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'checked_in') throw new Error('Chỉ booking đang ở mới check-out được')
  if (booking.remainingAmount > 0) {
    await Payment.create({
      booking: booking._id, type: 'remaining', method, amount: booking.remainingAmount,
      status: 'paid', paidAt: new Date(), confirmedBy: by,
    })
    booking.paidAmount = booking.totalAmount
    booking.remainingAmount = 0
  }
  booking.paymentStatus = 'paid'
  await exports.transition(booking, 'checked_out', by, 'Khách trả phòng')
  if (booking.room) await Room.findByIdAndUpdate(booking.room, { status: 'cleaning' })
  return booking
}

// Complete -> đóng booking (BR-28: không sửa được nữa)
exports.complete = async (bookingId, { by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'checked_out') throw new Error('Chỉ booking đã trả phòng mới hoàn tất được')
  if (booking.paymentStatus !== 'paid') throw new Error('Chưa thanh toán đủ, không thể hoàn tất')
  await exports.transition(booking, 'completed', by, 'Hoàn tất')
  return booking
}

// Bật/tắt phụ phí giường phụ (lễ tân) -> tính lại bill
exports.setBedSurcharge = async (bookingId, apply, by) => {
  const booking = await loadBooking(bookingId)
  if (!['pending', 'confirmed', 'checked_in'].includes(booking.status))
    throw new Error('Chỉ chỉnh phụ phí khi booking chưa check-out')
  booking.bedSurchargeApplied = !!apply
  recalcBill(booking)
  await booking.save()
  return booking
}

// TODO(Quốc) GĐ3/4: addExtraService, addMissingAmenity, cancel, markNoShow, transferRoom (in-house), updateBooking.
