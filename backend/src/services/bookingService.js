// Owner: Quốc — HỢP ĐỒNG LIÊN-MODULE. Khánh (booking online) gọi create().
// Nguồn sự thật cho vòng đời booking. Status/flow theo docs/STATUS_WORKFLOW_SPEC.md.
const Booking = require('../models/bookingModel')
const HoldRoom = require('../models/holdRoomModel')
const Room = require('../models/roomModel')
const Branch = require('../models/branchModel')
const RoomType = require('../models/roomTypeModel')
const RoomPrice = require('../models/roomPriceModel')
const BookingStatusHistory = require('../models/bookingStatusHistoryModel')

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

  // Availability (BR-23)
  if ((await countAvailableRooms(roomType._id, branch._id, checkIn, checkOut)) <= 0)
    throw new Error('Hết phòng cho khoảng thời gian đã chọn')

  // Tính tiền
  const roomCharge = await computeRoomCharge(roomType, checkIn, checkOut)
  const depositAmount = Math.round(branch.depositRate * roomCharge)
  const totalAmount = roomCharge // extra services/amenities cộng sau
  const remainingAmount = totalAmount - depositAmount

  const booking = await Booking.create({
    code: await genBookingCode(branch.code),
    branch: branch._id,
    roomType: roomType._id,
    customer: source === 'online' ? p.customerId : undefined,
    guestName: p.guestName,
    guestPhone: p.guestPhone,
    checkIn, checkOut,
    guests: p.guests || 1,
    source,
    status: 'pending',
    paymentStatus: 'unpaid',
    roomCharge, depositAmount, totalAmount, remainingAmount, paidAmount: 0,
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

// TODO(Quốc): confirmDeposit (webhook/quầy -> confirmed + paymentStatus=partial),
//   checkIn (gán room, -> checked_in, gọi housekeepingService.createOnCheckIn),
//   checkOut (thu remaining -> checked_out + paymentStatus=paid), complete,
//   addExtraService, addMissingAmenity, recalcBill, cancel, markNoShow, transferRoom (in-house).
