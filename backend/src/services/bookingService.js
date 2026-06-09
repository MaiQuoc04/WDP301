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
const Service = require('../models/serviceModel')
const Amenity = require('../models/amenityModel')
const mongoose = require('mongoose')

// Chạy `work(session)` trong 1 transaction, retry khi đụng write-conflict (chống đặt trùng - review #2)
async function runInTransaction(work, retries = 4) {
  for (let attempt = 1; ; attempt++) {
    const session = await mongoose.startSession()
    try {
      session.startTransaction()
      const result = await work(session)
      await session.commitTransaction()
      return result
    } catch (e) {
      try { await session.abortTransaction() } catch (_) { /* noop */ }
      const transient = typeof e.hasErrorLabel === 'function' &&
        (e.hasErrorLabel('TransientTransactionError') || e.hasErrorLabel('UnknownTransactionCommitResult'))
      const writeConflict = e.code === 112 || e.codeName === 'WriteConflict'
      if ((transient || writeConflict) && attempt < retries) continue
      throw e
    } finally {
      session.endSession()
    }
  }
}

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

// Tính tiền phòng theo KHOẢNG giá (RoomPrice); ngày ngoài mọi khoảng -> RoomType.basePrice. docs §9.1
async function computeRoomCharge(roomType, checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut)
  let total = 0
  for (let i = 0; i < nights; i++) {
    const day = startOfDay(new Date(startOfDay(checkIn).getTime() + i * DAY))
    // RoomPrice phủ ngày này (nhiều khoảng chồng nhau -> ưu tiên khoảng bắt đầu muộn nhất)
    const rp = await RoomPrice.findOne({
      roomType: roomType._id,
      startDate: { $lte: day },
      endDate: { $gte: day },
    }).sort('-startDate')
    const base = rp && rp.price != null ? rp.price : roomType.basePrice
    const discount = rp ? (rp.discount || 0) : 0
    total += base * (1 - discount / 100)
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

// Tính lại tổng dịch vụ + tổng thiết bị thiếu từ các dòng
function recomputeExtras(booking) {
  booking.extraServicesTotal = (booking.services || []).reduce((s, x) => s + x.price * x.quantity, 0)
  booking.missingAmenitiesTotal = (booking.missingAmenities || []).reduce((s, x) => s + x.price * x.quantity, 0)
  return booking
}

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

  // Tính tiền (đọc, ngoài transaction)
  const nights = nightsBetween(checkIn, checkOut)
  const roomCharge = await computeRoomCharge(roomType, checkIn, checkOut)
  const depositAmount = Math.round(branch.depositRate * roomCharge)
  const bedSurcharge = occ.extraChildren * (roomType.extraChildFee || 0) * nights // ước tính, chưa áp
  const totalAmount = roomCharge // phụ phí/dịch vụ cộng sau qua recalcBill
  const remainingAmount = totalAmount // chưa trả gì (paid 0)
  // Hạn cọc cho đặt online; walk-in không hết hạn (lễ tân tự quản)
  const expiresAt = source === 'online'
    ? new Date(Date.now() + (branch.pendingTimeoutMinutes || 15) * 60 * 1000) : undefined
  const code = await genBookingCode(branch.code)

  // Transaction: re-check availability (BR-23) + tạo, NGUYÊN TỬ để chống đặt trùng (review #2).
  // $inc RoomType.bookingSeq buộc 2 giao dịch đồng thời cùng loại phòng xung đột -> 1 cái retry rồi thấy hết phòng.
  return runInTransaction(async (session) => {
    const totalRooms = await Room.countDocuments({ roomType: roomType._id, branch: branch._id }).session(session)
    const overlap = await Booking.countDocuments({
      roomType: roomType._id, status: { $in: OCCUPYING },
      checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn },
    }).session(session)
    if (totalRooms - overlap <= 0) throw new Error('Hết phòng cho khoảng thời gian đã chọn')

    const [booking] = await Booking.create([{
      code, branch: branch._id, roomType: roomType._id,
      customer: source === 'online' ? p.customerId : undefined,
      guestName: p.guestName, guestPhone: p.guestPhone,
      checkIn, checkOut, guests: adults + children, adults, children,
      source, status: 'pending', paymentStatus: 'unpaid',
      roomCharge, depositAmount, totalAmount, remainingAmount, paidAmount: 0,
      bedSurcharge, bedSurchargeApplied: false, expiresAt, createdBy: p.createdBy,
    }], { session })

    if (source === 'online') {
      await HoldRoom.create([{ roomType: roomType._id, customer: p.customerId, booking: booking._id, checkIn, checkOut, expiresAt }], { session })
    }
    await BookingStatusHistory.create([{ booking: booking._id, fromStatus: null, toStatus: 'pending', changedBy: p.createdBy, note: `Tạo booking (${source})` }], { session })
    await RoomType.updateOne({ _id: roomType._id }, { $inc: { bookingSeq: 1 } }, { session }) // serialize chống đặt trùng
    return booking
  })
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
  // Nhận phòng NGUYÊN TỬ (compare-and-set status) chống 2 check-in cùng giành 1 phòng (review #2)
  let room
  const CLAIM = { $in: ['available', 'cleaning'] }
  if (roomId) {
    room = await Room.findOneAndUpdate(
      { _id: roomId, branch: booking.branch, roomType: booking.roomType, status: CLAIM },
      { $set: { status: 'occupied' } }, { new: true })
    if (!room) {
      const exists = await Room.findOne({ _id: roomId, branch: booking.branch, roomType: booking.roomType })
      throw new Error(exists ? `Phòng đang ${exists.status}, không nhận được` : 'Phòng không hợp lệ (sai chi nhánh/loại phòng)')
    }
  } else {
    const candidates = await Room.find({ branch: booking.branch, roomType: booking.roomType, status: CLAIM }).sort('roomNumber').select('_id')
    for (const cand of candidates) {
      const claimed = await Room.findOneAndUpdate({ _id: cand._id, status: CLAIM }, { $set: { status: 'occupied' } }, { new: true })
      if (claimed) { room = claimed; break }
    }
    if (!room) throw new Error('Không còn phòng trống cùng loại để gán')
  }
  booking.room = room._id
  try {
    await exports.transition(booking, 'checked_in', by, `Nhận phòng ${room.roomNumber}`)
  } catch (e) {
    await Room.findByIdAndUpdate(room._id, { status: 'available' }) // revert nếu transition lỗi
    throw e
  }
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

// ---------- GĐ3: Bill (UC-32/33/34) ----------
const BILL_EDITABLE = ['confirmed', 'checked_in']

// UC-32: thêm dịch vụ phát sinh vào bill
exports.addExtraService = async (bookingId, serviceId, quantity = 1, by) => {
  const booking = await loadBooking(bookingId)
  if (!BILL_EDITABLE.includes(booking.status)) throw new Error('Chỉ thêm dịch vụ khi booking đã xác nhận / đang ở')
  const service = await Service.findOne({ _id: serviceId, branch: booking.branch })
  if (!service || service.status !== 'active') throw new Error('Dịch vụ không khả dụng')
  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  booking.services.push({ service: service._id, name: service.name, price: service.price, quantity: qty, addedAt: new Date() })
  recomputeExtras(booking); recalcBill(booking); await booking.save()
  return booking
}
exports.removeExtraService = async (bookingId, lineId, by) => {
  const booking = await loadBooking(bookingId)
  if (!BILL_EDITABLE.includes(booking.status)) throw new Error('Chỉ sửa bill khi chưa check-out')
  if (!booking.services.id(lineId)) throw new Error('Không tìm thấy dòng dịch vụ')
  booking.services.pull(lineId)
  recomputeExtras(booking); recalcBill(booking); await booking.save()
  return booking
}

// UC-33: ghi thiết bị thiếu vào bill (lễ tân; Tú cũng ghi vào mảng này từ UC-50)
exports.addMissingAmenity = async (bookingId, amenityId, quantity = 1, by) => {
  const booking = await loadBooking(bookingId)
  if (!BILL_EDITABLE.includes(booking.status)) throw new Error('Chỉ ghi thiết bị thiếu khi chưa check-out')
  const amenity = await Amenity.findOne({ _id: amenityId, branch: booking.branch })
  if (!amenity) throw new Error('Thiết bị không hợp lệ')
  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  booking.missingAmenities.push({ amenity: amenity._id, name: amenity.name, price: amenity.missingPrice, quantity: qty })
  recomputeExtras(booking); recalcBill(booking); await booking.save()
  return booking
}
exports.removeMissingAmenity = async (bookingId, lineId, by) => {
  const booking = await loadBooking(bookingId)
  if (!BILL_EDITABLE.includes(booking.status)) throw new Error('Chỉ sửa bill khi chưa check-out')
  if (!booking.missingAmenities.id(lineId)) throw new Error('Không tìm thấy dòng thiết bị')
  booking.missingAmenities.pull(lineId)
  recomputeExtras(booking); recalcBill(booking); await booking.save()
  return booking
}

// UC-34: hoá đơn tổng hợp
exports.getBill = async (bookingId) => {
  const b = await loadBooking(bookingId)
  return {
    code: b.code, status: b.status, paymentStatus: b.paymentStatus,
    roomCharge: b.roomCharge,
    services: b.services, extraServicesTotal: b.extraServicesTotal,
    missingAmenities: b.missingAmenities, missingAmenitiesTotal: b.missingAmenitiesTotal,
    bedSurchargeEstimate: b.bedSurcharge, bedSurchargeApplied: b.bedSurchargeApplied,
    bedSurcharge: b.bedSurchargeApplied ? b.bedSurcharge : 0,
    depositAmount: b.depositAmount, creditApplied: b.creditApplied,
    totalAmount: b.totalAmount, paidAmount: b.paidAmount, remainingAmount: b.remainingAmount,
  }
}

// ---------- GĐ4: huỷ / no-show ----------
// UC-35: huỷ booking trước check-in. Cọc đã thu KHÔNG hoàn (BR).
exports.cancel = async (bookingId, { reason, by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (!['pending', 'confirmed'].includes(booking.status)) throw new Error('Chỉ huỷ được booking chưa check-in')
  booking.cancelReason = reason || 'Huỷ bởi lễ tân'
  await exports.transition(booking, 'cancelled', by, booking.cancelReason)
  await HoldRoom.deleteMany({ booking: booking._id })
  return booking
}

// UC-36: đánh no-show (giữ cọc) — chỉ khi confirmed & đã tới ngày check-in
exports.markNoShow = async (bookingId, { by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'confirmed') throw new Error('Chỉ đánh no-show booking đã xác nhận')
  if (startOfDay(new Date()) < booking.checkIn) throw new Error('Chưa tới ngày check-in, không thể đánh no-show')
  await exports.transition(booking, 'no_show', by, 'Khách không đến (giữ cọc)')
  await HoldRoom.deleteMany({ booking: booking._id })
  return booking
}

// Job: tự huỷ booking pending quá hạn cọc (chỉ online có expiresAt). Trả về số lượng đã huỷ.
exports.expirePendingBookings = async () => {
  const expired = await Booking.find({ status: 'pending', expiresAt: { $lt: new Date() } })
  for (const b of expired) {
    b.cancelReason = 'payment_timeout'
    await exports.transition(b, 'cancelled', null, 'Tự huỷ: quá hạn thanh toán cọc')
    await HoldRoom.deleteMany({ booking: b._id })
  }
  return expired.length
}

// UC-37: đổi phòng in-house (khách đang ở) — cùng chi nhánh & cùng loại phòng, giữ nguyên booking
exports.transferRoom = async (bookingId, { newRoomId, by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'checked_in') throw new Error('Chỉ đổi phòng khi khách đang ở (checked_in)')
  if (!newRoomId) throw new Error('Thiếu phòng mới')
  const newRoom = await Room.findOne({ _id: newRoomId, branch: booking.branch, roomType: booking.roomType })
  if (!newRoom) throw new Error('Phòng mới không hợp lệ (phải cùng chi nhánh & loại phòng)')
  if (String(newRoom._id) === String(booking.room)) throw new Error('Trùng phòng hiện tại')
  if (['occupied', 'maintenance', 'locked'].includes(newRoom.status)) throw new Error(`Phòng mới đang ${newRoom.status}`)
  const oldRoomId = booking.room
  newRoom.status = 'occupied'; await newRoom.save()
  if (oldRoomId) await Room.findByIdAndUpdate(oldRoomId, { status: 'cleaning' })
  booking.room = newRoom._id
  await booking.save()
  await logStatus(booking._id, booking.status, booking.status, by, `Đổi phòng -> ${newRoom.roomNumber}`)
  return booking
}

// UC-38: cập nhật thông tin booking (số khách / tên / sđt / ghi chú). Đổi số khách -> tính lại bedSurcharge.
exports.updateBooking = async (bookingId, { adults, children, guestName, guestPhone, notes, by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (!['pending', 'confirmed', 'checked_in'].includes(booking.status)) throw new Error('Chỉ cập nhật booking chưa check-out')
  if (guestName !== undefined) booking.guestName = guestName
  if (guestPhone !== undefined) booking.guestPhone = guestPhone
  if (notes !== undefined) booking.notes = notes
  if (adults !== undefined || children !== undefined) {
    const newAdults = adults !== undefined ? adults : booking.adults
    const newChildren = children !== undefined ? children : booking.children
    const roomType = await RoomType.findById(booking.roomType)
    const occ = computeOccupancy(roomType, newAdults, newChildren)
    if (!occ.fitsAdults) throw new Error('Số người lớn vượt sức chứa phòng')
    booking.adults = newAdults; booking.children = newChildren; booking.guests = newAdults + newChildren
    const nights = nightsBetween(booking.checkIn, booking.checkOut)
    booking.bedSurcharge = occ.extraChildren * (roomType.extraChildFee || 0) * nights
    recalcBill(booking) // nếu bedSurchargeApplied thì total cập nhật theo
  }
  await booking.save()
  return booking
}

// TODO(Quốc) GĐ5: room schedule/timeline (UC-39/40), transactions (UC-41/42).
