// Owner: Quốc — HỢP ĐỒNG LIÊN-MODULE. Khánh (booking online) gọi create().
// Nguồn sự thật cho vòng đời booking. Status/flow theo docs/STATUS_WORKFLOW_SPEC.md.
const Booking = require('../models/bookingModel')
const BookingGroup = require('../models/bookingGroupModel')
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
const recurringDayTypeFor = (day) => ([0, 5, 6].includes(day.getDay()) ? 'weekend' : 'weekday')

// Áp giờ khách sạn khi chỉ truyền NGÀY (YYYY-MM-DD): nhận 14:00, trả 12:00.
// Dùng CHUNG cho cả tìm phòng lẫn tạo booking để overlap nhất quán (tránh ẩn phòng turnover cùng ngày).
const applyHotelHours = (v, h, m) => {
  const d = new Date(v)
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) d.setHours(h, m, 0, 0)
  return d
}

// Phí giờ (nhận sớm / trả muộn): 10% giá đêm cho mỗi giờ.
const HOURLY_RATE_PCT = 0.10
const MAX_EARLY_HOURS = 3            // nhận sớm tối đa 3 giờ (sớm nhất 11:00); ngày turnover tự kẹp theo giờ trả booking trước
const EARLY_WINDOW_HOURS = 4        // chỉ cho nhận sớm khi hiện tại còn ≤ 4 giờ tới giờ nhận chuẩn (không nhận sớm cả buổi/ngày)
const LATE_NIGHT_THRESHOLD_HOURS = 6 // trả muộn quá 6 giờ (sau 12:00 -> qua 18:00) = tính 1 đêm

// Trạng thái booking đang "chiếm" phòng (BR-23)
const OCCUPYING = ['pending', 'confirmed', 'checked_in']

// Số phòng còn trống của 1 roomType trong khoảng [checkIn, checkOut)
// = tổng phòng - số booking đang chiếm trùng lịch (mỗi pending đã kèm 1 HoldRoom nên không đếm hold riêng để khỏi trùng).
async function countAvailableRooms(roomTypeId, branchId, checkIn, checkOut) {
  const totalRooms = await Room.countDocuments({ roomType: roomTypeId, branch: branchId, isDeleted: { $ne: true } })
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

// PHÒNG CỤ THỂ còn trống cho [checkIn, checkOut)? = không có booking đang chiếm trùng giờ trên phòng đó
async function isRoomFree(roomId, checkIn, checkOut, session) {
  const q = Booking.countDocuments({
    room: roomId, status: { $in: OCCUPYING },
    checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn },
  })
  if (session) q.session(session)
  return (await q) === 0
}
exports.isRoomFree = isRoomFree

// Tìm danh sách PHÒNG CỤ THỂ còn trống + hợp party (dùng chung walk-in & online). docs §9.7 + per-room availability.
exports.searchAvailableRooms = async (branchId, checkIn, checkOut, adults = 1, children = 0, opts = {}) => {
  // Áp giờ khách sạn (14:00 / 12:00) cho ngày-only -> overlap khớp với booking thật
  const ci = applyHotelHours(checkIn, 14, 0), co = applyHotelHours(checkOut, 12, 0)
  const roomFilter = { branch: branchId, isDeleted: { $ne: true }, status: { $nin: ['maintenance', 'locked'] } }
  if (opts.roomTypeId) roomFilter.roomType = opts.roomTypeId
  const rooms = await Room.find(roomFilter).populate('roomType').sort('roomNumber').lean()
  const busy = await Booking.find({
    branch: branchId, room: { $ne: null }, status: { $in: OCCUPYING },
    checkIn: { $lt: co }, checkOut: { $gt: ci },
  }).distinct('room')
  const busySet = new Set(busy.map(String))
  const nights = nightsBetween(ci, co)
  const candidates = rooms.filter((room) => room.roomType && !busySet.has(String(room._id)))
  // Tính tiền phòng 1 LẦN mỗi LOẠI phòng (nhiều phòng cùng loại -> khỏi tính lặp; tránh chậm/timeout khi đặt dài + nhiều phòng)
  const distinctTypes = [...new Map(candidates.map((r) => [String(r.roomType._id), r.roomType])).values()]
  const chargeByType = new Map()
  await Promise.all(distinctTypes.map(async (rt) => chargeByType.set(String(rt._id), await computeRoomCharge(rt, ci, co))))
  const out = candidates.map((room) => {
    const occ = computeOccupancy(room.roomType, adults, children)
    const roomCharge = chargeByType.get(String(room.roomType._id))
    const surcharge = occ.extraBeds * (room.roomType.extraBedFee || 0) * nights
    return {
      roomId: room._id, roomNumber: room.roomNumber, floor: room.floor,
      roomType: { _id: room.roomType._id, name: room.roomType.name, capacity: room.roomType.capacity, totalBeds: room.roomType.totalBeds },
      capacity: occ.capacity, partyUnits: occ.partyUnits, extraBeds: occ.extraBeds, surplusUnits: occ.surplusUnits,
      fit: occ.extraBeds > 0 ? 'short' : (occ.surplusUnits > 0 ? 'surplus' : 'exact'),
      nights, roomCharge, surcharge, total: roomCharge + surcharge,
    }
  })
  // Ưu tiên: vừa đủ -> dư (ít->nhiều) -> thiếu (cuối); trong nhóm theo giá tăng dần
  const rank = (r) => (r.fit === 'exact' ? 0 : r.fit === 'surplus' ? 10 + r.surplusUnits : 1000 + r.extraBeds)
  out.sort((a, b) => rank(a) - rank(b) || a.total - b.total)
  return out
}

// Tính tiền phòng theo KHOẢNG giá (RoomPrice); ngày ngoài mọi khoảng -> RoomType.basePrice. docs §9.1
// Nạp bảng giá 1 LẦN rồi tính trong bộ nhớ (trước đây query mỗi đêm -> đặt dài bị chậm/timeout).
async function computeRoomCharge(roomType, checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut)
  // Các khoảng giá có NGÀY (sự kiện/khuyến mãi) — sắp giảm dần startDate để "khoảng bắt đầu muộn nhất" thắng.
  const dated = await RoomPrice.find({
    roomType: roomType._id, startDate: { $ne: null }, endDate: { $ne: null },
  }).sort('-startDate').lean()
  // Giá lặp theo loại ngày (weekday/weekend) — lấy bản mới nhất mỗi dayType.
  const recurring = await RoomPrice.find({
    roomType: roomType._id, startDate: null, endDate: null,
  }).sort('-updatedAt').lean()
  const recurringByType = {}
  for (const rp of recurring) if (!(rp.dayType in recurringByType)) recurringByType[rp.dayType] = rp

  let total = 0
  for (let i = 0; i < nights; i++) {
    const day = startOfDay(new Date(startOfDay(checkIn).getTime() + i * DAY))
    const t = day.getTime()
    // Khoảng phủ ngày này; `dated` đã sort giảm dần startDate nên bản đầu tiên = bắt đầu muộn nhất.
    let rp = dated.find((p) => new Date(p.startDate).getTime() <= t && new Date(p.endDate).getTime() >= t)
    if (!rp) rp = recurringByType[recurringDayTypeFor(day)]
    const base = rp && rp.price != null ? rp.price : roomType.basePrice
    const discount = rp ? (rp.discount || 0) : 0
    total += base * (1 - discount / 100)
  }
  return Math.round(total)
}
exports.computeRoomCharge = computeRoomCharge

// Mô hình sức chứa theo "đơn vị": người lớn=1, trẻ em=0.5 (2 trẻ = 1 suất).
// Sức chứa chuẩn = roomType.capacity (KHÔNG suy từ số giường). docs §9.7
// Vượt sức chứa -> giường phụ: ghép cặp trẻ, TRẺ LẺ (0.5) MIỄN (floor). Người lớn thừa luôn tính nguyên giường.
// Phương án B: luôn đặt được; vượt -> phụ phí GIƯỜNG PHỤ (áp cho cả lớn lẫn nhỏ).
const ADULT_UNIT = 1, CHILD_UNIT = 0.5
function computeOccupancy(roomType, adults = 1, children = 0) {
  const capacity = roomType.capacity || 2
  const partyUnits = adults * ADULT_UNIT + children * CHILD_UNIT
  const extraBeds = Math.floor(Math.max(0, partyUnits - capacity))   // giường phụ tính phí (trẻ lẻ -> miễn)
  const surplusUnits = Math.max(0, capacity - partyUnits)            // còn dư chỗ trong sức chứa
  return { capacity, partyUnits, extraBeds, surplusUnits }
}
exports.computeOccupancy = computeOccupancy

// Báo giá 1 room type cho yêu cầu (Khánh dùng ở màn tìm phòng): tiền phòng + phụ phí giường phụ (/đêm).
exports.quote = async (roomType, checkIn, checkOut, adults = 1, children = 0) => {
  const nights = nightsBetween(checkIn, checkOut)
  const roomCharge = await computeRoomCharge(roomType, checkIn, checkOut)
  const occ = computeOccupancy(roomType, adults, children)
  const surcharge = occ.extraBeds * (roomType.extraBedFee || 0) * nights
  return { nights, roomCharge, extraBeds: occ.extraBeds, surplusUnits: occ.surplusUnits, surcharge, total: roomCharge + surcharge }
}

// Tính lại bill: total = phòng + dịch vụ + amenity thiếu + (phụ phí giường phụ nếu đã áp); remaining = total - đã trả - credit
// Mốc bắt đầu chặng hiện tại (đổi phòng). Chưa đổi -> = checkIn.
const segmentStart = (booking) => booking.roomSegmentStart || booking.checkIn
// Giá đêm trung bình của CHẶNG HIỆN TẠI (để tính phí giờ = 10% giá đêm). Phí giờ áp lúc trả phòng
// nên phải theo phòng khách đang ở, không phải trung bình cả kỳ đã đổi phòng.
function nightlyRate(booking) {
  const nights = Math.max(1, nightsBetween(segmentStart(booking), booking.checkOut))
  return Math.round((booking.roomCharge || 0) / nights)
}
function recalcBill(booking) {
  // Tiền phòng + giường phụ = (các chặng đã khoá) + (chặng hiện tại). Booking chưa đổi phòng:
  // Locked=0 -> ra đúng số cũ. KHÔNG kẹp remaining về 0: đổi xuống phòng rẻ khi đã trả đủ ->
  // remaining âm = "khách sạn cần hoàn khách" (hoàn thủ công), giấu số đi thì lễ tân không biết hoàn bao nhiêu.
  const roomTotal = (booking.roomChargeLocked || 0) + (booking.roomCharge || 0)
  const surcharge = (booking.bedSurchargeLocked || 0) + (booking.bedSurchargeApplied ? (booking.bedSurcharge || 0) : 0)
  // Phí giờ: nhận sớm + trả muộn (10% giá đêm/giờ); trả muộn quá 18:00 -> tính 1 đêm
  const nightly = nightlyRate(booking)
  const perHour = Math.round(nightly * HOURLY_RATE_PCT)
  const earlyFee = perHour * (booking.earlyHours || 0)
  const lateFee = booking.lateFullNight ? nightly : perHour * (booking.lateHours || 0)
  booking.extraHourFee = earlyFee + lateFee
  booking.totalAmount = roomTotal + (booking.extraServicesTotal || 0) + (booking.missingAmenitiesTotal || 0) + surcharge + booking.extraHourFee
  booking.remainingAmount = booking.totalAmount - (booking.paidAmount || 0) - (booking.creditApplied || 0)
  return booking
}

async function refreshPendingDeposit(booking) {
  if (booking.status !== 'pending' || booking.paymentStatus !== 'unpaid') return booking
  const branch = await Branch.findById(booking.branch)
  booking.depositAmount = Math.round((branch?.depositRate || 0) * booking.totalAmount)
  return booking
}
exports.recalcBill = recalcBill

// Tính lại tổng dịch vụ + tổng thiết bị thiếu từ các dòng
function recomputeExtras(booking) {
  booking.extraServicesTotal = (booking.services || []).reduce((s, x) => s + x.price * x.quantity, 0)
  booking.missingAmenitiesTotal = (booking.missingAmenities || []).reduce((s, x) => s + x.price * x.quantity, 0)
  return booking
}
exports.recomputeExtras = recomputeExtras

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

// Realtime: báo 1 booking vừa đổi (trạng thái/bill) để mọi màn đang mở tự cập nhật. Defensive.
function emitBookingUpdated(bookingId) {
  if (!bookingId) return
  try { require('../config/socket').emitBookingUpdated(bookingId) }
  catch (e) { console.warn('[Socket] emitBookingUpdated:', e.message) }
}

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
  emitBookingUpdated(booking._id) // realtime: mọi màn đang mở booking/nhóm/list tự cập nhật
  return booking
}


// ========== ĐẶT NHIỀU PHÒNG (BookingGroup) — walk-in ==========
// Mỗi phòng vẫn là 1 Booking riêng (vòng đời độc lập); group gom nhận dạng + tiền (1 mã, 1 cọc).

async function genGroupCode(branchCode) {
  const year = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    const code = `G${branchCode}-${year}-${Math.floor(100000 + Math.random() * 900000)}`
    if (!(await BookingGroup.exists({ code }))) return code
  }
  throw new Error('Không sinh được mã nhóm, thử lại')
}

// Chia khách vào các phòng sao cho TỔNG TIỀN phụ phí NHỎ NHẤT (hoà tiền -> ít giường hơn -> chia đều hơn).
// KHÔNG dùng greedy "nhét vào phòng còn nhiều chỗ nhất": giá là hàm BẬC THANG floor(suất - sức chứa), không
// tuyến tính theo chỗ trống. Phòng ĐÃ phải kê giường còn 0.5 suất đi ké miễn phí; phòng chưa kê chỉ cần vượt
// 0.5 là mất nguyên 1 giường -> greedy thu vượt khách (5NL+2TE vào 2 phòng cap 2: greedy 2 giường, đúng là 1).
// Input bé (vài phòng, vài chục khách) nên quy hoạch động ra cực tiểu tuyệt đối thay vì đoán.
// rooms: [{ roomId, capacity, extraBedFee }] — thiếu extraBedFee => coi mọi giường đồng giá (tối thiểu SỐ giường).
// Trả [{ roomId, adults, children }], mỗi phòng >= 1 người lớn.
exports.autoAllocate = function autoAllocate(adults, children, rooms) {
  const N = Array.isArray(rooms) ? rooms.length : 0
  if (!N) return []
  const A = Math.max(0, Math.floor(Number(adults) || 0))
  const C = Math.max(0, Math.floor(Number(children) || 0))
  const cap = rooms.map((r) => r.capacity || 2)
  const fee = rooms.map((r) => (Number.isFinite(r.extraBedFee) ? r.extraBedFee : 1))
  const beds = (i, a, c) => Math.floor(Math.max(0, a * ADULT_UNIT + c * CHILD_UNIT - cap[i]))
  const emit = (al) => al.map((x, i) => ({ roomId: rooms[i].roomId, adults: x.adults, children: x.children }))

  // Không đủ 1 người lớn/phòng: caller đã chặn trước, vẫn trả kết quả để lỗi báo đúng chỗ.
  if (A < N) {
    const al = rooms.map((_, i) => ({ adults: i < A ? 1 : 0, children: 0 }))
    for (let i = 0; i < C; i++) al[i % N].children++
    return emit(al)
  }

  // Dự phòng khi input phi lý làm nổ DP: xếp từng khách vào chỗ có CHI PHÍ BIÊN thấp nhất.
  const greedy = () => {
    const al = rooms.map(() => ({ adults: 1, children: 0 }))
    const add = (key, left) => {
      for (let n = 0; n < left; n++) {
        let bi = 0, bk = null
        for (let i = 0; i < N; i++) {
          const b0 = beds(i, al[i].adults, al[i].children)
          al[i][key]++
          const k = [(beds(i, al[i].adults, al[i].children) - b0) * fee[i],
            -(cap[i] - (al[i].adults * ADULT_UNIT + al[i].children * CHILD_UNIT))]
          al[i][key]--
          if (!bk || k[0] < bk[0] || (k[0] === bk[0] && k[1] < bk[1])) { bi = i; bk = k }
        }
        al[bi][key]++
      }
    }
    add('adults', A - N); add('children', C)
    return emit(al)
  }
  if (N * (A + 1) * (A + 1) * (C + 1) * (C + 1) > 5e6) return greedy()

  // dp[a][c] = [tiền, số giường, độ lệch sức chứa] — 2 khoá sau chỉ phá hoà, không đổi tiền.
  const better = (x, y) => !y || x[0] < y[0] || (x[0] === y[0] && (x[1] < y[1] || (x[1] === y[1] && x[2] < y[2])))
  const K = (a, c) => a * (C + 1) + c
  let cur = new Array((A + 1) * (C + 1)).fill(null)
  cur[K(0, 0)] = [0, 0, 0]
  const trace = []
  for (let i = 0; i < N; i++) {
    const next = new Array((A + 1) * (C + 1)).fill(null)
    const ch = new Array((A + 1) * (C + 1)).fill(null)
    const reserve = N - 1 - i                    // chừa 1 người lớn cho mỗi phòng phía sau
    for (let a = 0; a <= A; a++) for (let c = 0; c <= C; c++) {
      const st = cur[K(a, c)]
      if (!st) continue
      for (let ai = 1; ai <= A - a - reserve; ai++) for (let ci = 0; ci <= C - c; ci++) {
        const b = beds(i, ai, ci)
        const d = ai * ADULT_UNIT + ci * CHILD_UNIT - cap[i]
        const cost = [st[0] + b * fee[i], st[1] + b, st[2] + d * d]
        const k = K(a + ai, c + ci)
        if (better(cost, next[k])) { next[k] = cost; ch[k] = { ai, ci, prev: K(a, c) } }
      }
    }
    cur = next; trace.push(ch)
  }
  let k = K(A, C)
  if (!cur[k]) return greedy()
  const al = new Array(N)
  for (let i = N - 1; i >= 0; i--) { const t = trace[i][k]; al[i] = { adults: t.ai, children: t.ci }; k = t.prev }
  return emit(al)
}

// Báo giá 1 phòng cho party cụ thể (tiền phòng + phụ phí giường phụ /đêm).
async function priceRoomParty(roomType, checkIn, checkOut, adults, children) {
  const nights = nightsBetween(checkIn, checkOut)
  const roomCharge = await computeRoomCharge(roomType, checkIn, checkOut)
  const occ = computeOccupancy(roomType, adults, children)
  const bedSurcharge = occ.extraBeds * (roomType.extraBedFee || 0) * nights
  return { nights, roomCharge, occ, bedSurcharge }
}

// Dựng danh sách dịch vụ kèm + tổng tiền (dùng cho từng phòng khi tạo nhóm)
async function buildServices(list, branchId) {
  const services = []
  let extraServicesTotal = 0
  for (const s of (Array.isArray(list) ? list : [])) {
    const svc = await Service.findOne({ _id: s.serviceId || s.service, branch: branchId, status: 'active' })
    if (!svc) continue
    const qty = Math.max(1, parseInt(s.quantity, 10) || 1)
    services.push({ service: svc._id, name: svc.name, price: svc.price, quantity: qty, addedAt: new Date() })
    extraServicesTotal += svc.price * qty
  }
  return { services, extraServicesTotal }
}

// Nạp + validate các phòng của 1 nhóm (cùng chi nhánh, active, không bảo trì/khoá, không trùng) VÀ chia khách vào phòng.
//  - items chỉ có roomId  -> hệ thống TỰ CHIA theo adultsTotal/childrenTotal (tối thiểu tổng tiền). Lễ tân không chia tay nữa.
//  - items có adults/children -> dùng đúng như caller gửi (đường override / chỉnh lẻ từng phòng sau khi tạo).
// Trả Map(roomId -> room+roomType+adults+children).
async function loadGroupRooms(items, branch, adultsTotal, childrenTotal) {
  if (!Array.isArray(items) || !items.length) throw new Error('Chọn ít nhất 1 phòng')
  const ids = items.map((it) => String(it.roomId))
  if (new Set(ids).size !== ids.length) throw new Error('Có phòng bị chọn trùng')

  const loaded = []
  for (const it of items) {
    const room = await Room.findOne({ _id: it.roomId, isDeleted: { $ne: true } }).populate('roomType')
    if (!room) throw new Error('Phòng không tồn tại')
    if (String(room.branch) !== String(branch._id)) throw new Error(`Phòng ${room.roomNumber} không thuộc chi nhánh`)
    if (['maintenance', 'locked'].includes(room.status)) throw new Error(`Phòng ${room.roomNumber} đang ${room.status}, không thể đặt`)
    if (!room.roomType || room.roomType.status !== 'active') throw new Error(`Loại phòng của phòng ${room.roomNumber} không khả dụng`)
    loaded.push({ it, room })
  }

  const auto = loaded.every(({ it }) => it.adults == null)
  let alloc = null
  if (auto) {
    const A = Math.max(0, Math.floor(Number(adultsTotal) || 0))
    const C = Math.max(0, Math.floor(Number(childrenTotal) || 0))
    if (A < loaded.length) throw new Error(`Cần ít nhất ${loaded.length} người lớn cho ${loaded.length} phòng (mỗi phòng 1 người lớn)`)
    const res = exports.autoAllocate(A, C, loaded.map(({ room }) => ({
      roomId: String(room._id), capacity: room.roomType.capacity || 2, extraBedFee: room.roomType.extraBedFee,
    })))
    alloc = new Map(res.map((r) => [String(r.roomId), r]))
  }

  const map = new Map()
  for (const { it, room } of loaded) {
    const src = auto ? alloc.get(String(room._id)) : it
    const adults = Number(src.adults) || 0
    const children = Number(src.children) || 0
    if (adults < 1) throw new Error('Mỗi phòng phải có ít nhất 1 người lớn')
    if (children < 0) throw new Error('Số trẻ em không hợp lệ')
    map.set(String(room._id), { room, adults, children, services: it.services })
  }
  return map
}

// Báo giá NHÓM cho các phòng đã chọn. Không ghi DB. Dùng cho CẢ bước chọn phòng lẫn bước xác nhận
// -> hai bước không thể lệch nhau vì cùng 1 trọng tài.
// items: [{ roomId, services? }] + tổng khách -> tự chia. (Gửi kèm adults/children từng phòng = override.)
exports.quoteGroup = async (branchId, checkInRaw, checkOutRaw, items = [], adultsTotal, childrenTotal) => {
  const checkIn = applyHotelHours(checkInRaw, 14, 0)
  const checkOut = applyHotelHours(checkOutRaw, 12, 0)
  if (!(checkIn instanceof Date) || isNaN(checkIn) || isNaN(checkOut)) throw new Error('Ngày không hợp lệ')
  if (nightsBetween(checkIn, checkOut) < 1) throw new Error('Phải ở tối thiểu 1 đêm')
  const branch = await Branch.findById(branchId)
  if (!branch || !branch.isActive) throw new Error('Chi nhánh không tồn tại hoặc đã ngừng hoạt động')
  const map = await loadGroupRooms(items, branch, adultsTotal, childrenTotal)

  const rooms = []
  let totalRoomCharge = 0, totalSurcharge = 0, totalServices = 0, totalAmount = 0, depositAmount = 0
  for (const { room, adults, children, services: svcList } of map.values()) {
    const pr = await priceRoomParty(room.roomType, checkIn, checkOut, adults, children)
    const { extraServicesTotal } = await buildServices(svcList, branch._id)
    const surcharge = pr.bedSurcharge // áp khi >0 (giống tạo booking đơn)
    const total = pr.roomCharge + (surcharge > 0 ? surcharge : 0) + extraServicesTotal
    const deposit = Math.round(branch.depositRate * total)
    rooms.push({
      roomId: room._id, roomNumber: room.roomNumber, floor: room.floor,
      roomType: { _id: room.roomType._id, name: room.roomType.name, capacity: room.roomType.capacity },
      adults, children,
      capacity: pr.occ.capacity, partyUnits: pr.occ.partyUnits, extraBeds: pr.occ.extraBeds, surplusUnits: pr.occ.surplusUnits,
      fit: pr.occ.extraBeds > 0 ? 'short' : (pr.occ.surplusUnits > 0 ? 'surplus' : 'exact'),
      nights: pr.nights, roomCharge: pr.roomCharge, surcharge, extraServicesTotal, total, deposit,
    })
    totalRoomCharge += pr.roomCharge; totalSurcharge += (surcharge > 0 ? surcharge : 0)
    totalServices += extraServicesTotal; totalAmount += total; depositAmount += deposit
  }
  return {
    nights: nightsBetween(checkIn, checkOut), roomCount: rooms.length,
    adultsTotal: rooms.reduce((s, r) => s + r.adults, 0),
    childrenTotal: rooms.reduce((s, r) => s + r.children, 0),
    rooms, totalRoomCharge, totalSurcharge, totalServices, totalAmount, depositAmount,
  }
}

// Tạo NHÓM nhiều phòng trong 1 transaction. Một phòng kẹt (đặt trùng) -> rollback cả nhóm.
// p: { branchId, guestName, guestPhone, checkIn, checkOut, source, createdBy, items:[{roomId,adults,children,services?}], adultsTotal?, childrenTotal? }
exports.createGroup = async (p) => {
  const source = p.source || 'walk_in'
  const checkIn = applyHotelHours(p.checkIn, 14, 0)
  const checkOut = applyHotelHours(p.checkOut, 12, 0)
  if (!(checkIn instanceof Date) || isNaN(checkIn) || isNaN(checkOut)) throw new Error('Ngày không hợp lệ')
  if (nightsBetween(checkIn, checkOut) < 1) throw new Error('Phải ở tối thiểu 1 đêm (check-out > check-in)')
  if (checkIn < startOfDay(new Date())) throw new Error('Không thể đặt cho ngày trong quá khứ')
  if (source === 'walk_in' && !p.guestName) throw new Error('Walk-in cần tên khách')

  const branch = await Branch.findById(p.branchId)
  if (!branch || !branch.isActive) throw new Error('Chi nhánh không tồn tại hoặc đã ngừng hoạt động')
  const map = await loadGroupRooms(p.items, branch, p.adultsTotal, p.childrenTotal)

  // Đối chiếu tổng khai báo (nếu FE gửi) = Σ allocation
  const adultsTotal = [...map.values()].reduce((s, x) => s + x.adults, 0)
  const childrenTotal = [...map.values()].reduce((s, x) => s + x.children, 0)
  if (p.adultsTotal != null && Number(p.adultsTotal) !== adultsTotal)
    throw new Error(`Tổng người lớn (${p.adultsTotal}) không khớp phân bổ phòng (${adultsTotal})`)
  if (p.childrenTotal != null && Number(p.childrenTotal) !== childrenTotal)
    throw new Error(`Tổng trẻ em (${p.childrenTotal}) không khớp phân bổ phòng (${childrenTotal})`)

  // Tính tiền từng phòng (đọc, ngoài transaction)
  const priced = []
  let groupTotal = 0, groupDeposit = 0
  for (const { room, adults, children, services: svcList } of map.values()) {
    const pr = await priceRoomParty(room.roomType, checkIn, checkOut, adults, children)
    const { services, extraServicesTotal } = await buildServices(svcList, branch._id)
    const bedSurchargeApplied = pr.bedSurcharge > 0
    const total = pr.roomCharge + extraServicesTotal + (bedSurchargeApplied ? pr.bedSurcharge : 0)
    const deposit = Math.round(branch.depositRate * total)
    priced.push({ room, adults, children, services, extraServicesTotal, roomCharge: pr.roomCharge, bedSurcharge: pr.bedSurcharge, bedSurchargeApplied, total, deposit })
    groupTotal += total; groupDeposit += deposit
  }

  const groupCode = await genGroupCode(branch.code)
  const codes = []
  for (let i = 0; i < priced.length; i++) codes.push(await genBookingCode(branch.code))

  const result = await runInTransaction(async (session) => {
    const [group] = await BookingGroup.create([{
      code: groupCode, branch: branch._id, source,
      customer: source === 'online' ? p.customerId : undefined,
      guestName: p.guestName, guestPhone: p.guestPhone,
      checkIn, checkOut, adultsTotal, childrenTotal, roomCount: priced.length,
      totalAmount: groupTotal, depositAmount: groupDeposit, notes: p.notes, createdBy: p.createdBy,
    }], { session })

    const bookings = []
    for (let i = 0; i < priced.length; i++) {
      const pc = priced[i]
      if (!(await isRoomFree(pc.room._id, checkIn, checkOut, session)))
        throw new Error(`Phòng ${pc.room.roomNumber} đã có booking trùng thời gian`)
      const [booking] = await Booking.create([{
        code: codes[i], group: group._id, branch: branch._id, roomType: pc.room.roomType._id, room: pc.room._id,
        customer: source === 'online' ? p.customerId : undefined,
        guestName: p.guestName, guestPhone: p.guestPhone,
        checkIn, checkOut, guests: pc.adults + pc.children, adults: pc.adults, children: pc.children,
        source, status: 'pending', paymentStatus: 'unpaid',
        roomCharge: pc.roomCharge, depositAmount: pc.deposit, extraServicesTotal: pc.extraServicesTotal,
        totalAmount: pc.total, remainingAmount: pc.total, paidAmount: 0,
        services: pc.services, bedSurcharge: pc.bedSurcharge, bedSurchargeApplied: pc.bedSurchargeApplied,
        createdBy: p.createdBy,
      }], { session })
      await BookingStatusHistory.create([{ booking: booking._id, fromStatus: null, toStatus: 'pending', changedBy: p.createdBy, note: `Tạo booking nhóm ${groupCode} - phòng ${pc.room.roomNumber}` }], { session })
      await Room.updateOne({ _id: pc.room._id }, { $inc: { bookingSeq: 1 } }, { session })
      bookings.push(booking)
    }
    return { group, bookings }
  })

  try {
    const { getIO } = require('../config/socket')
    result.bookings.forEach((b) => getIO().emit('new_booking', { roomId: b.room, branchId: branch._id }))
  } catch (err) { console.warn('[Socket] Emit new_booking (group) error:', err.message) }

  return result
}

// ========== ĐẶT NHIỀU PHÒNG ONLINE (khách chọn LOẠI + SỐ LƯỢNG, hệ thống tự gán phòng + tự chia khách) ==========

// Dựng danh sách "phòng ảo" theo loại + số lượng (mỗi phần tử = 1 phòng sẽ đặt). Validate loại phòng thuộc chi nhánh.
async function buildVirtualRooms(items, branch) {
  const virtual = []
  for (const it of (Array.isArray(items) ? items : [])) {
    const qty = Math.max(0, parseInt(it.quantity, 10) || 0)
    if (!qty) continue
    const rt = await RoomType.findById(it.roomTypeId)
    if (!rt || rt.status !== 'active' || String(rt.branch) !== String(branch._id))
      throw new Error('Loại phòng không khả dụng')
    for (let i = 0; i < qty; i++) virtual.push({ idx: virtual.length, roomType: rt })
  }
  return virtual
}

// Báo giá NHÓM ONLINE: tự chia khách vào các phòng đã chọn (tối thiểu phụ phí) rồi tính tiền. Không ghi DB.
// items: [{ roomTypeId, quantity }]. Trả tổng + phụ phí + tình trạng sức chứa cho thanh tóm tắt.
exports.quoteGroupOnline = async (branchId, checkInRaw, checkOutRaw, items = [], adults = 1, children = 0) => {
  const checkIn = applyHotelHours(checkInRaw, 14, 0)
  const checkOut = applyHotelHours(checkOutRaw, 12, 0)
  if (!(checkIn instanceof Date) || isNaN(checkIn) || isNaN(checkOut)) throw new Error('Ngày không hợp lệ')
  if (nightsBetween(checkIn, checkOut) < 1) throw new Error('Phải ở tối thiểu 1 đêm')
  const branch = await Branch.findById(branchId)
  if (!branch || !branch.isActive) throw new Error('Chi nhánh không tồn tại hoặc đã ngừng hoạt động')
  adults = Math.max(0, Number(adults) || 0)
  children = Math.max(0, Number(children) || 0)

  const virtual = await buildVirtualRooms(items, branch)
  const roomCount = virtual.length
  const partyUnits = adults * ADULT_UNIT + children * CHILD_UNIT
  if (!roomCount) {
    return { nights: nightsBetween(checkIn, checkOut), roomCount: 0, rooms: [], totalRoomCharge: 0, totalSurcharge: 0, totalAmount: 0, depositAmount: 0, capacityTotal: 0, partyUnits, enoughCapacity: false, enoughAdults: true }
  }
  if (adults < roomCount) throw new Error(`Cần ít nhất ${roomCount} người lớn cho ${roomCount} phòng (mỗi phòng 1 người lớn)`)

  // extraBedFee/đêm: số đêm chung cả nhóm nên tối thiểu Σ(giường × phí) là tối thiểu đúng tổng tiền khách trả.
  const alloc = exports.autoAllocate(adults, children, virtual.map((v) => ({ roomId: v.idx, capacity: v.roomType.capacity || 2, extraBedFee: v.roomType.extraBedFee })))
  const allocByIdx = {}; alloc.forEach((a) => { allocByIdx[a.roomId] = a })

  const rooms = []
  let totalRoomCharge = 0, totalSurcharge = 0, totalAmount = 0, depositAmount = 0, capacityTotal = 0
  for (const v of virtual) {
    const a = allocByIdx[v.idx] || { adults: 0, children: 0 }
    const pr = await priceRoomParty(v.roomType, checkIn, checkOut, a.adults, a.children)
    const surcharge = pr.bedSurcharge > 0 ? pr.bedSurcharge : 0
    const total = pr.roomCharge + surcharge
    capacityTotal += pr.occ.capacity
    rooms.push({
      roomTypeId: v.roomType._id, roomTypeName: v.roomType.name, capacity: pr.occ.capacity,
      adults: a.adults, children: a.children, extraBeds: pr.occ.extraBeds, surcharge, roomCharge: pr.roomCharge, total,
    })
    totalRoomCharge += pr.roomCharge; totalSurcharge += surcharge; totalAmount += total
    depositAmount += Math.round(branch.depositRate * total)
  }
  return {
    nights: nightsBetween(checkIn, checkOut), roomCount, adultsTotal: adults, childrenTotal: children,
    rooms, totalRoomCharge, totalSurcharge, totalAmount, depositAmount,
    // "Đủ chỗ" = KHÔNG phát sinh giường phụ (khớp quy tắc floor: trẻ lẻ 0.5 được miễn), không so thô capacityTotal>=partyUnits.
    capacityTotal, partyUnits, enoughCapacity: totalSurcharge === 0, enoughAdults: adults >= roomCount,
  }
}

// Tạo NHÓM ONLINE: quy đổi số lượng -> phòng trống cụ thể từng loại, tự chia khách, HoldRoom + expiresAt (mức nhóm + phòng).
// Một phòng kẹt -> rollback cả nhóm. Trạng thái pending, chờ khách quét QR cọc gom.
exports.createGroupOnline = async (p) => {
  const source = 'online'
  const checkIn = applyHotelHours(p.checkIn, 14, 0)
  const checkOut = applyHotelHours(p.checkOut, 12, 0)
  if (!(checkIn instanceof Date) || isNaN(checkIn) || isNaN(checkOut)) throw new Error('Ngày không hợp lệ')
  if (nightsBetween(checkIn, checkOut) < 1) throw new Error('Phải ở tối thiểu 1 đêm (check-out > check-in)')
  if (checkIn < startOfDay(new Date())) throw new Error('Không thể đặt cho ngày trong quá khứ')
  if (!p.customerId && !p.guestName) throw new Error('Đặt online cần thông tin khách hàng')

  const branch = await Branch.findById(p.branchId)
  if (!branch || !branch.isActive) throw new Error('Chi nhánh không tồn tại hoặc đã ngừng hoạt động')
  const adults = Math.max(0, Number(p.adults) || 0)
  const children = Math.max(0, Number(p.children) || 0)

  const virtual = await buildVirtualRooms(p.items, branch)
  const roomCount = virtual.length
  if (!roomCount) throw new Error('Chọn ít nhất 1 phòng')
  if (adults < roomCount) throw new Error(`Cần ít nhất ${roomCount} người lớn cho ${roomCount} phòng (mỗi phòng 1 người lớn)`)

  // extraBedFee/đêm: số đêm chung cả nhóm nên tối thiểu Σ(giường × phí) là tối thiểu đúng tổng tiền khách trả.
  const alloc = exports.autoAllocate(adults, children, virtual.map((v) => ({ roomId: v.idx, capacity: v.roomType.capacity || 2, extraBedFee: v.roomType.extraBedFee })))
  const allocByIdx = {}; alloc.forEach((a) => { allocByIdx[a.roomId] = a })

  // Tính tiền từng phòng ảo (đọc, ngoài transaction)
  const priced = []
  let groupTotal = 0, groupDeposit = 0, adultsTotal = 0, childrenTotal = 0
  for (const v of virtual) {
    const a = allocByIdx[v.idx] || { adults: 0, children: 0 }
    const pr = await priceRoomParty(v.roomType, checkIn, checkOut, a.adults, a.children)
    const bedSurchargeApplied = pr.bedSurcharge > 0
    const total = pr.roomCharge + (bedSurchargeApplied ? pr.bedSurcharge : 0)
    const deposit = Math.round(branch.depositRate * total)
    priced.push({ roomType: v.roomType, adults: a.adults, children: a.children, roomCharge: pr.roomCharge, bedSurcharge: pr.bedSurcharge, bedSurchargeApplied, total, deposit })
    groupTotal += total; groupDeposit += deposit; adultsTotal += a.adults; childrenTotal += a.children
  }

  const expiresAt = new Date(Date.now() + (branch.pendingTimeoutMinutes || 15) * 60 * 1000)
  const groupCode = await genGroupCode(branch.code)
  const codes = []
  for (let i = 0; i < priced.length; i++) codes.push(await genBookingCode(branch.code))

  const result = await runInTransaction(async (session) => {
    const [group] = await BookingGroup.create([{
      code: groupCode, branch: branch._id, source, customer: p.customerId,
      guestName: p.guestName, guestPhone: p.guestPhone,
      checkIn, checkOut, adultsTotal, childrenTotal, roomCount: priced.length,
      totalAmount: groupTotal, depositAmount: groupDeposit, expiresAt, notes: p.notes, createdBy: p.createdBy,
    }], { session })

    const usedRoomIds = new Set()
    const bookings = []
    for (let i = 0; i < priced.length; i++) {
      const pc = priced[i]
      // Tìm 1 phòng trống của loại này, chưa dùng trong nhóm, không trùng lịch (nguyên tử theo phòng).
      const candidates = await Room.find({
        branch: branch._id, roomType: pc.roomType._id,
        isDeleted: { $ne: true }, status: { $nin: ['maintenance', 'locked'] },
      }).sort('roomNumber').session(session)
      let room = null
      for (const cand of candidates) {
        if (usedRoomIds.has(String(cand._id))) continue
        if (await isRoomFree(cand._id, checkIn, checkOut, session)) { room = cand; break }
      }
      if (!room) throw new Error(`Hết phòng trống loại ${pc.roomType.name} cho khoảng thời gian đã chọn`)
      usedRoomIds.add(String(room._id))

      const [booking] = await Booking.create([{
        code: codes[i], group: group._id, branch: branch._id, roomType: pc.roomType._id, room: room._id,
        customer: p.customerId, guestName: p.guestName, guestPhone: p.guestPhone,
        checkIn, checkOut, guests: pc.adults + pc.children, adults: pc.adults, children: pc.children,
        source, status: 'pending', paymentStatus: 'unpaid',
        roomCharge: pc.roomCharge, depositAmount: pc.deposit, extraServicesTotal: 0,
        totalAmount: pc.total, remainingAmount: pc.total, paidAmount: 0,
        bedSurcharge: pc.bedSurcharge, bedSurchargeApplied: pc.bedSurchargeApplied, expiresAt, createdBy: p.createdBy,
      }], { session })
      await HoldRoom.create([{ roomType: pc.roomType._id, room: room._id, customer: p.customerId, booking: booking._id, checkIn, checkOut, expiresAt }], { session })
      await BookingStatusHistory.create([{ booking: booking._id, fromStatus: null, toStatus: 'pending', changedBy: p.createdBy, note: `Tạo booking nhóm online ${groupCode} - phòng ${room.roomNumber}` }], { session })
      await Room.updateOne({ _id: room._id }, { $inc: { bookingSeq: 1 } }, { session })
      bookings.push(booking)
    }
    return { group, bookings }
  })

  try {
    const { getIO } = require('../config/socket')
    result.bookings.forEach((b) => getIO().emit('new_booking', { roomId: b.room, branchId: branch._id }))
  } catch (err) { console.warn('[Socket] Emit new_booking (group online) error:', err.message) }

  return result
}

// Thu cọc GOM cho cả nhóm: 1 Payment (gắn group + booking đại diện), tất cả phòng pending -> confirmed.
// paidFull=true: khách trả toàn bộ ngay.
exports.confirmGroupDeposit = async (groupId, { method = 'cash', transactionCode, by, paidFull = false, skipCreatePayment = false } = {}) => {
  const group = await BookingGroup.findById(groupId)
  if (!group) { const e = new Error('Nhóm đặt phòng không tồn tại'); e.status = 404; throw e }
  const members = await Booking.find({ group: group._id, status: 'pending' })
  if (!members.length) throw new Error('Nhóm không còn phòng nào đang chờ cọc')

  let amount = 0
  for (const b of members) {
    b.paidAmount = paidFull ? b.totalAmount : b.depositAmount
    b.remainingAmount = b.totalAmount - b.paidAmount
    b.paymentStatus = paidFull ? 'paid' : 'partial'
    amount += b.paidAmount
    await exports.transition(b, 'confirmed', by, paidFull ? 'Thanh toán toàn bộ (nhóm)' : 'Đã thu cọc (nhóm)')
  }
  // skipCreatePayment: PayOS đã tạo Payment(group) rồi và webhook chỉ cập nhật trạng thái -> không tạo trùng.
  if (!skipCreatePayment) {
    await Payment.create({
      booking: members[0]._id, group: group._id, type: 'deposit', method, amount,
      status: 'paid', paidAt: new Date(), transactionCode, confirmedBy: by,
    })
  }
  await HoldRoom.deleteMany({ booking: { $in: members.map((b) => b._id) } })
  return exports.getGroupDetail(group._id)
}

// Khách rời trang checkout / bấm quay lại khi CHƯA cọc -> huỷ các phòng PENDING của nhóm + nhả HoldRoom NGAY
// (không đợi timeout 15'). Chỉ đụng phòng 'pending' -> nhóm đã cọc/confirmed thì no-op (an toàn).
exports.cancelGroup = async (groupId, { reason = 'Khách huỷ giữ chỗ', by } = {}) => {
  const members = await Booking.find({ group: groupId, status: 'pending' })
  for (const b of members) {
    b.cancelReason = reason
    await exports.transition(b, 'cancelled', by, reason)
    await HoldRoom.deleteMany({ booking: b._id })
  }
  return { cancelled: members.length }
}

// ========== THAO TÁC HÀNG LOẠT CẢ NHÓM (lễ tân) — loop hàm lẻ nên GIỮ NGUYÊN business rule từng phòng ==========
async function getGroupOr404(groupId) {
  const g = await BookingGroup.findById(groupId)
  if (!g) { const e = new Error('Nhóm đặt phòng không tồn tại'); e.status = 404; throw e }
  return g
}

// Tự phân housekeeper cho danh sách phòng: ưu tiên gần tầng nhất -> tải thấp nhất, rải đều trong đợt. null nếu chi nhánh chưa có HK.
async function autoAssignHousekeepers(branchId, rooms) {
  const pool = await require('./housekeepingService').suggestHousekeepers(branchId, null)
  if (!pool.length) return null
  const load = {}; pool.forEach((h) => { load[String(h.accountId)] = 0 })
  const assign = {}
  for (const room of rooms) {
    let best = null, bestScore = null
    for (const h of pool) {
      const floors = h.floors || []
      const dist = floors.length && room.floor != null
        ? (floors.includes(room.floor) ? 0 : Math.min(...floors.map((f) => Math.abs(f - room.floor))))
        : (floors.length ? 0 : 999)
      const score = [dist, h.activeTasks + load[String(h.accountId)]]
      if (!best || score[0] < bestScore[0] || (score[0] === bestScore[0] && score[1] < bestScore[1])) { best = h; bestScore = score }
    }
    assign[String(room.bookingId)] = best.accountId
    load[String(best.accountId)] += 1
  }
  return assign
}

// Xếp phòng theo LỘ TRÌNH DỌN: tầng thấp -> cao, cùng tầng theo số phòng tăng dần.
// Dùng chung cho checkOutGroup và bản xem trước -> thứ tự xem trước = thứ tự thật.
async function roomsInCleaningOrder(members) {
  const withRoom = []
  for (const b of members) {
    const room = b.room ? await Room.findById(b.room).select('floor roomNumber') : null
    withRoom.push({ booking: b, roomId: b.room, floor: room?.floor ?? 9999, roomNumber: room?.roomNumber || '' })
  }
  withRoom.sort((a, x) => (a.floor - x.floor) || String(a.roomNumber).localeCompare(String(x.roomNumber), 'vi', { numeric: true }))
  return withRoom
}

// Xem TRƯỚC khi trả cả nhóm: phòng nào, ai sẽ được giao dọn, thu bao nhiêu.
// Gọi ĐÚNG autoAssignHousekeepers mà checkOutGroup dùng -> bảng xem trước không thể lệch với việc thật sự xảy ra
// (tự tính lại ở chỗ khác chính là nguồn gốc mọi bug lệch nhau của hệ thống này).
exports.previewCheckOutGroup = async (groupId) => {
  const group = await getGroupOr404(groupId)
  const members = await Booking.find({ group: groupId, status: 'checked_in' })
  const withRoom = await roomsInCleaningOrder(members)
  const totalRemaining = withRoom.reduce((s, w) => s + Math.max(0, w.booking.remainingAmount || 0), 0)
  if (!members.length) return { rooms: [], totalRemaining: 0, canAssign: true }

  const assign = await autoAssignHousekeepers(group.branch, withRoom.map((w) => ({ bookingId: w.booking._id, roomId: w.roomId, floor: w.floor })))
  const pool = await require('./housekeepingService').suggestHousekeepers(group.branch, null)
  const nameById = Object.fromEntries(pool.map((h) => [String(h.accountId), h.fullName || h.email]))
  return {
    canAssign: !!assign, // false = chi nhánh chưa có nhân viên buồng phòng -> trả phòng sẽ bị chặn
    totalRemaining,
    // Cả danh sách HK của chi nhánh để lễ tân đổi người nếu muốn. Kèm activeTasks:
    // autoAssign ưu tiên TẦNG trước tải việc nên hay dồn cả nhóm cho 1 người —
    // lễ tân phải thấy ai đang quá tải mới quyết được có nên san bớt hay không.
    housekeepers: pool.map((h) => ({
      accountId: h.accountId, name: h.fullName || h.email, floors: h.floors,
      activeTasks: h.activeTasks, onFloor: h.onFloor,
    })),
    rooms: withRoom.map((w) => ({
      bookingId: w.booking._id, roomNumber: w.roomNumber, floor: w.floor,
      remaining: Math.max(0, w.booking.remainingAmount || 0),
      housekeeperId: assign ? (assign[String(w.booking._id)] || null) : null, // để FE điền sẵn dropdown
      housekeeper: assign ? (nameById[String(assign[String(w.booking._id)])] || null) : null,
    })),
  }
}

// Áp 1 thao tác cho các phòng đủ điều kiện; phòng không hợp lệ -> bỏ qua + báo lý do (không chặn cả nhóm).
async function applyToMembers(members, fn) {
  const done = [], skipped = []
  for (const b of members) {
    try { await fn(b); done.push(String(b._id)) }
    catch (e) { skipped.push({ booking: String(b._id), room: b.room ? String(b.room) : null, message: e.message }) }
  }
  return { done: done.length, skipped }
}

// Nhận TẤT CẢ phòng đã cọc (phòng chưa sẵn sàng sẽ bị bỏ qua + báo lý do).
exports.checkInGroup = async (groupId, { by } = {}) => {
  await getGroupOr404(groupId)
  const members = await Booking.find({ group: groupId, status: 'confirmed' })
  if (!members.length) throw new Error('Nhóm không có phòng nào ở trạng thái đã cọc để nhận')
  return applyToMembers(members, (b) => exports.checkIn(b._id, { by }))
}

// Đánh no-show TẤT CẢ phòng đã cọc (đã tới ngày nhận).
exports.noShowGroup = async (groupId, { by } = {}) => {
  await getGroupOr404(groupId)
  const members = await Booking.find({ group: groupId, status: 'confirmed' })
  if (!members.length) throw new Error('Nhóm không có phòng nào đã cọc để đánh no-show')
  return applyToMembers(members, (b) => exports.markNoShow(b._id, { by }))
}

// Huỷ TẤT CẢ phòng trước check-in (pending/confirmed). Cọc đã thu không hoàn.
exports.cancelGroupAll = async (groupId, { reason, by } = {}) => {
  await getGroupOr404(groupId)
  const members = await Booking.find({ group: groupId, status: { $in: ['pending', 'confirmed'] } })
  if (!members.length) throw new Error('Nhóm không có phòng nào huỷ được (chỉ huỷ trước check-in)')
  return applyToMembers(members, (b) => exports.cancel(b._id, { reason: reason || 'Huỷ cả nhóm', by }))
}

// Trả phòng TẤT CẢ: tự phân housekeeper theo tầng+tải + thu tiền còn lại GOM 1 lần.
// Tạo task dọn theo THỨ TỰ (tầng, số phòng) -> assignedAt tăng dần theo lộ trình -> housekeeper dọn có chủ đích (FIFO hợp lý).
// skipPayment=true khi tiền còn lại đã thu qua PayOS QR (Payment 'remaining' đã tạo) — không tạo lại giao dịch tiền mặt.
// assignees: { [bookingId]: housekeeperAccountId } — lễ tân ghi đè người dọn cho vài phòng.
// Phòng không có trong map thì vẫn dùng người auto chọn -> không đụng gì là nhanh như cũ.
exports.checkOutGroup = async (groupId, { by, method = 'cash', skipPayment = false, assignees = {} } = {}) => {
  const group = await getGroupOr404(groupId)
  const members = await Booking.find({ group: groupId, status: 'checked_in' })
  if (!members.length) throw new Error('Nhóm không có phòng nào đang ở để trả')

  // Phòng khách CHƯA từng nhận thì không thể "trả" — nhưng cũng KHÔNG được im lặng bỏ qua:
  // trả xong nhóm vẫn còn phòng treo (khách đã trả tiền mà không dùng), lễ tân phải biết để xử lý.
  const untouched = await Booking.find({ group: groupId, status: { $in: ['pending', 'confirmed'] } })
    .populate('room', 'roomNumber').lean()
  const skipped = untouched.map((b) => ({
    booking: String(b._id), room: b.room ? String(b.room._id) : null,
    message: `Phòng ${b.room?.roomNumber || '?'} chưa nhận phòng nên không có gì để trả`,
  }))

  const withRoom = await roomsInCleaningOrder(members) // cùng hàm với previewCheckOutGroup -> thứ tự khớp nhau

  const assign = await autoAssignHousekeepers(group.branch, withRoom.map((w) => ({ bookingId: w.booking._id, roomId: w.roomId, floor: w.floor })))
  if (!assign) throw new Error('Chi nhánh chưa có nhân viên buồng phòng để giao dọn phòng')

  const hk = require('./housekeepingService')
  // Ghi đè người dọn: ưu tiên tham số truyền vào (luồng tiền mặt, gọi thẳng từ màn hình);
  // không có thì lấy bản đã cất trên nhóm lúc tạo QR (luồng QR — webhook gọi, không có tham số).
  const saved = group.cleaningAssignees ? Object.fromEntries(group.cleaningAssignees) : {}
  const overrides = Object.keys(assignees || {}).length ? assignees : saved
  // Validate TRƯỚC vòng lặp: người không thuộc chi nhánh thì phải hỏng ngay,
  // đừng để trả xong nửa nhóm mới lăn ra lỗi rồi bỏ dở giữa chừng.
  for (const [bookingId, hkId] of Object.entries(overrides)) {
    if (!hkId) continue
    if (!withRoom.some((w) => String(w.booking._id) === String(bookingId))) continue // không thuộc nhóm -> bỏ
    await hk.assertHousekeeperInBranch(hkId, group.branch)
    assign[String(bookingId)] = hkId
  }

  let totalRemaining = 0
  for (const w of withRoom) {                         // theo đúng thứ tự tầng/phòng đã sort
    const b = w.booking
    totalRemaining += Math.max(0, b.remainingAmount || 0)
    b.paidAmount = b.totalAmount; b.remainingAmount = 0; b.paymentStatus = 'paid'
    await exports.transition(b, 'checked_out', by, 'Trả phòng (cả nhóm)')
    if (b.room) await Room.findByIdAndUpdate(b.room, { status: 'cleaning' })
    try { await hk.createTurnover(b._id, b.room, assign[String(b._id)]) }
    catch (e) { console.warn('[checkOutGroup] createTurnover lỗi:', e.message) }
    await exports.transition(b, 'completed', by, 'Hoàn tất (tự động sau trả phòng)') // bỏ bước complete thủ công
  }
  if (totalRemaining > 0 && !skipPayment) {
    await Payment.create({ booking: members[0]._id, group: group._id, type: 'remaining', method, amount: totalRemaining, status: 'paid', paidAt: new Date(), confirmedBy: by })
  }
  return { done: members.length, skipped, collected: totalRemaining }
}

// Gộp trạng thái nhóm từ các phòng (rollup, chỉ để hiển thị)
function rollupGroupStatus(members) {
  const active = members.filter((b) => !['cancelled', 'no_show'].includes(b.status))
  if (!active.length) {
    if (!members.length) return 'pending'
    return members.every((b) => b.status === 'no_show') ? 'no_show' : 'cancelled'
  }
  const allIs = (s) => active.every((b) => b.status === s)
  if (allIs('completed')) return 'completed'
  if (active.every((b) => ['checked_out', 'completed'].includes(b.status))) return 'checked_out'
  if (active.some((b) => b.status === 'checked_in')) return 'checked_in'
  if (active.every((b) => ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(b.status))) return 'confirmed'
  return 'pending'
}
exports.rollupGroupStatus = rollupGroupStatus

// Rollup tiền + trạng thái của 1 nhóm từ các member booking (LIVE, dùng cho cả list & chi tiết).
// mixed: các phòng còn hiệu lực KHÔNG cùng một trạng thái (VD 2 phòng đã nhận, 1 phòng còn chờ).
// Vì sao không trả thẳng status = 'mixed': bộ lọc của lễ tân so trực tiếp với status này
// (receptionService.listBookings), nên đổi status sẽ làm nhóm hỗn hợp BIẾN MẤT khỏi mọi bộ lọc.
// Giữ status = pha chính (để lọc/sắp xếp vẫn chạy) + cờ mixed & breakdown để hiện nhãn cảnh báo.
function groupRollup(members) {
  const active = members.filter((b) => !['cancelled', 'no_show'].includes(b.status))
  const sum = (k) => active.reduce((s, b) => s + (b[k] || 0), 0)
  const totalAmount = sum('totalAmount'), paidAmount = sum('paidAmount'), remainingAmount = sum('remainingAmount')
  const paymentStatus = remainingAmount <= 0 && paidAmount > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'
  // Đếm theo trạng thái, tính cả huỷ/no-show để lễ tân thấy đủ bức tranh khi nhóm bị lệch.
  const counts = {}
  members.forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1 })
  const breakdown = Object.entries(counts).map(([status, count]) => ({ status, count }))
  return {
    status: rollupGroupStatus(members),
    mixed: new Set(active.map((b) => b.status)).size > 1,
    breakdown,
    roomCount: members.length, activeCount: active.length,
    totalAmount, paidAmount, remainingAmount, paymentStatus,
    depositAmount: sum('depositAmount'),
  }
}
exports.groupRollup = groupRollup

// Chi tiết nhóm: group + các phòng (populate) + payments + rollup tiền/trạng thái (tính LIVE từ member bookings).
exports.getGroupDetail = async (groupId) => {
  const group = await BookingGroup.findById(groupId).populate('branch', 'name isActive').lean()
  if (!group) { const e = new Error('Nhóm đặt phòng không tồn tại'); e.status = 404; throw e }
  const members = await Booking.find({ group: groupId })
    .populate('roomType', 'name capacity').populate('room', 'roomNumber floor').sort('code').lean()
  const payments = await Payment.find({ group: groupId }).sort('createdAt').lean()
  return { group, members, payments, rollup: groupRollup(members) }
}

// ---------- Vòng đời booking (GĐ2) ----------
async function loadBooking(bookingId) {
  const b = await Booking.findById(bookingId)
  if (!b) { const e = new Error('Booking không tồn tại'); e.status = 404; throw e }
  return b
}

// UC-18 (Khánh gọi sau webhook PayOS) / thu cọc tại quầy: pending -> confirmed
// skipCreatePayment=true khi PayOS webhook đã tạo Payment record rồi (tránh tạo trùng)
exports.confirmDeposit = async (bookingId, { method = 'online_qr', transactionCode, by, skipCreatePayment = false, paidFull = false } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'pending') throw new Error('Chỉ booking đang chờ cọc mới xác nhận được')
  // paidFull: khách thanh toán một lần toàn bộ (không cần thu remaining nữa).
  // Giao dịch phải ghi ĐÚNG số tiền thực thu (toàn bộ, không phải mỗi cọc) để sổ quỹ/doanh thu khớp booking.
  const collected = paidFull ? booking.totalAmount : booking.depositAmount
  if (!skipCreatePayment) {
    await Payment.create({
      booking: booking._id, type: 'deposit', method, amount: collected,
      status: 'paid', paidAt: new Date(), transactionCode, confirmedBy: by,
    })
  }
  booking.paidAmount = collected
  booking.remainingAmount = booking.totalAmount - booking.paidAmount
  booking.paymentStatus = paidFull ? 'paid' : 'partial'
  await exports.transition(booking, 'confirmed', by, paidFull ? 'Thanh toán toàn bộ' : 'Đã thu cọc')
  await HoldRoom.deleteMany({ booking: booking._id }) // hết cần giữ tạm
  return booking
}

// UC-30: check-in -> phòng đã gán lúc tạo, set occupied + sinh task dọn (Tú)
exports.checkIn = async (bookingId, { by } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'confirmed') throw new Error('Chỉ booking đã xác nhận mới check-in được')
  if (!booking.room) throw new Error('Booking chưa được gán phòng')
  // Chỉ phòng 'available' mới check-in được (phòng đang dọn/chờ bổ sung -> chưa nhận). docs §7
  const room = await Room.findOneAndUpdate(
    { _id: booking.room, status: 'available' },
    { $set: { status: 'occupied' } }, { new: false })
  if (!room) {
    const r = await Room.findById(booking.room)
    const reason = r && r.awaitingRestock ? 'chờ bổ sung thiết bị' : (r ? r.status : '?')
    throw new Error(`Phòng ${r ? r.roomNumber : ''} đang ${reason}, chưa thể nhận`)
  }
  try {
    await exports.transition(booking, 'checked_in', by, `Nhận phòng ${room.roomNumber}`)
  } catch (e) {
    await Room.findByIdAndUpdate(room._id, { status: room.status }) // revert về trạng thái trước
    throw e
  }
  // Tự áp phụ phí giường phụ khi check-in (lễ tân có thể tắt sau qua setBedSurcharge)
  if (booking.bedSurcharge > 0 && !booking.bedSurchargeApplied) {
    booking.bedSurchargeApplied = true
    recalcBill(booking)
    await booking.save()
  }
  // 🔗 Housekeeping: check-in KHÔNG tạo task (housekeeper biết qua room='occupied').
  // Chỉ dọn task active còn sót của phòng từ booking khác. Defensive — không chặn check-in.
  try { await require('./housekeepingService').cleanupOnCheckIn(booking._id, room._id) }
  catch (e) { console.warn('[checkIn] cleanupOnCheckIn lỗi:', e.message) }
  return booking
}

// UC-31: check-out -> thu remaining + room cleaning
// method='cash' -> tạo Payment ngay
// method='online_qr' -> không tạo Payment (payosService đã tạo rồi); skipCreatePayment=true
exports.checkOut = async (bookingId, { method = 'cash', by, housekeeperId, skipCreatePayment = false } = {}) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'checked_in') throw new Error('Chỉ booking đang ở mới check-out được')
  if (booking.remainingAmount > 0 && !skipCreatePayment) {
    await Payment.create({
      booking: booking._id, type: 'remaining', method, amount: booking.remainingAmount,
      status: 'paid', paidAt: new Date(), confirmedBy: by,
    })
    booking.paidAmount = booking.totalAmount
    booking.remainingAmount = 0
  } else if (skipCreatePayment && booking.remainingAmount <= 0) {
    // Đã thu qua QR, đồng bộ lại giá trị
    booking.paidAmount = booking.totalAmount
    booking.remainingAmount = 0
  }
  booking.paymentStatus = 'paid'
  await exports.transition(booking, 'checked_out', by, 'Khách trả phòng')
  if (booking.room) await Room.findByIdAndUpdate(booking.room, { status: 'cleaning' })
  // 🔗 Housekeeping: sinh task dọn turnover (urgent), GIAO cho housekeeper lễ tân chọn. Defensive.
  try { await require('./housekeepingService').createTurnover(booking._id, booking.room, housekeeperId) }
  catch (e) { console.warn('[checkOut] createTurnover lỗi:', e.message) }
  // Trả phòng xong (đã thu đủ + bill đã chốt) -> HOÀN TẤT luôn, bỏ bước "complete" thủ công thừa thãi.
  await exports.transition(booking, 'completed', by, 'Hoàn tất (tự động sau trả phòng)')
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
  await refreshPendingDeposit(booking)
  await booking.save()
  return booking
}

// Nhận sớm: chỉ khi đã xác nhận (chưa check-in) + phòng đã sẵn sàng. Tối đa MAX_EARLY_HOURS giờ.
// 2 lớp bảo vệ khách ĐẶT NGÀY TRƯỚC + tránh nhận sớm quá đà:
//  (a) Cổng thời gian: chỉ cho nhận sớm khi hiện tại còn ≤ EARLY_WINDOW_HOURS tới giờ nhận chuẩn.
//  (b) Không lấn giờ trả của booking LIỀN TRƯỚC trên cùng phòng — soi gương setLateCheckout (kẹp theo lịch phòng).
exports.setEarlyCheckin = async (bookingId, hours, by) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'confirmed') throw new Error('Chỉ đặt nhận sớm khi booking đã xác nhận (chưa check-in)')
  const h = Math.max(0, parseInt(hours, 10) || 0)
  if (h > MAX_EARLY_HOURS) throw new Error(`Nhận sớm tối đa ${MAX_EARLY_HOURS} giờ`)

  const stdCheckIn = new Date(booking.checkIn) // giờ nhận chuẩn (14:00)
  if (h > 0) {
    // (a) Cổng thời gian: bây giờ phải nằm trong cửa sổ EARLY_WINDOW_HOURS trước giờ nhận chuẩn
    const windowOpensAt = stdCheckIn.getTime() - EARLY_WINDOW_HOURS * 3600000
    if (Date.now() < windowOpensAt) {
      const t = new Date(windowOpensAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      throw new Error(`Chưa tới giờ cho nhận sớm — chỉ nhận sớm trong vòng ${EARLY_WINDOW_HOURS} giờ trước giờ nhận (từ ${t})`)
    }

    if (booking.room) {
      const room = await Room.findById(booking.room)
      if (room && room.status !== 'available') throw new Error(`Phòng ${room.roomNumber} chưa sẵn sàng (đang ${room.status}) — chưa thể nhận sớm`)

      // (b) Không lấn giờ trả của booking liền trước trên cùng phòng (bảo vệ khách ngày trước)
      const prev = await Booking.findOne({
        room: booking.room, _id: { $ne: booking._id },
        status: { $in: OCCUPYING },
        checkOut: { $lte: stdCheckIn },
      }).sort('-checkOut')
      const earlyArrival = stdCheckIn.getTime() - h * 3600000
      if (prev && earlyArrival < new Date(prev.checkOut).getTime()) {
        const maxH = Math.max(0, Math.floor((stdCheckIn.getTime() - new Date(prev.checkOut).getTime()) / 3600000))
        const t = new Date(prev.checkOut).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        throw new Error(`Phòng có khách trả lúc ${t} — chỉ nhận sớm tối đa ${maxH} giờ`)
      }
    }
  }

  booking.earlyHours = h
  recalcBill(booking)
  await booking.save()
  return booking
}

// Trả muộn: chỉ khi đang ở. Chặn cứng theo lịch phòng; quá 18:00 -> tính 1 đêm.
exports.setLateCheckout = async (bookingId, hours, by) => {
  const booking = await loadBooking(bookingId)
  if (booking.status !== 'checked_in') throw new Error('Chỉ đặt trả muộn khi khách đang ở')
  const h = Math.max(0, parseInt(hours, 10) || 0)
  const stdCheckout = new Date(booking.checkOut) // giờ trả chuẩn (12:00)
  const newTime = new Date(stdCheckout.getTime() + h * 3600000)

  // Chặn cứng theo lịch phòng: không được lấn giờ nhận của khách kế tiếp cùng phòng
  if (h > 0 && booking.room) {
    const next = await Booking.findOne({
      room: booking.room, _id: { $ne: booking._id },
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkIn: { $gte: stdCheckout },
    }).sort('checkIn')
    if (next && newTime > next.checkIn) {
      const maxH = Math.max(0, Math.floor((next.checkIn - stdCheckout) / 3600000))
      const t = new Date(next.checkIn).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      throw new Error(`Phòng đã có khách nhận lúc ${t} — trả muộn tối đa ${maxH} giờ`)
    }
  }

  // Tính 1 đêm nếu giờ trả mới vượt mốc 18:00 của ngày trả (so mốc tuyệt đối, không cố định theo số giờ).
  const cutoff18 = new Date(stdCheckout); cutoff18.setHours(18, 0, 0, 0)
  booking.lateHours = h                          // luôn giữ số giờ để hiển thị bill
  booking.lateFullNight = h > 0 && newTime > cutoff18
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

// Đánh dấu dịch vụ đã/chưa triển khai tại phòng (toggle 2 chiều). Thuần vận hành, KHÔNG đổi bill.
exports.setServiceDelivered = async (bookingId, lineId, delivered, by) => {
  const booking = await loadBooking(bookingId)
  const line = booking.services.id(lineId)
  if (!line) throw new Error('Không tìm thấy dòng dịch vụ')
  if (delivered) {
    line.status = 'delivered'; line.deliveredAt = new Date(); line.deliveredBy = by
  } else {
    line.status = 'pending'; line.deliveredAt = undefined; line.deliveredBy = undefined
  }
  await booking.save()
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
  // Phí giờ: tách riêng nhận sớm / trả muộn (2 dòng) + tính từng khoản
  const nightly = nightlyRate(b)
  const perHour = Math.round(nightly * HOURLY_RATE_PCT)
  const earlyFee = perHour * (b.earlyHours || 0)
  const lateFee = b.lateFullNight ? nightly : perHour * (b.lateHours || 0)
  return {
    code: b.code, status: b.status, paymentStatus: b.paymentStatus,
    roomCharge: b.roomCharge,
    services: b.services, extraServicesTotal: b.extraServicesTotal,
    missingAmenities: b.missingAmenities, missingAmenitiesTotal: b.missingAmenitiesTotal,
    bedSurchargeEstimate: b.bedSurcharge, bedSurchargeApplied: b.bedSurchargeApplied,
    bedSurcharge: b.bedSurchargeApplied ? b.bedSurcharge : 0,
    earlyHours: b.earlyHours || 0, earlyFee,
    lateHours: b.lateHours || 0, lateFullNight: !!b.lateFullNight, lateFee,
    extraHourFee: b.extraHourFee || 0,
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

// Ân hạn trước khi thật sự nhả phòng: khách bấm chuyển ở giây chót thì tiền còn đang bay về (~10-20s).
// Huỷ ngay lúc hết hạn = tiền về sau khi phòng đã nhả -> khách mất tiền. Nán 60s để đón nốt.
// (Trước đây ân hạn này vẫn có nhưng là ĂN MAY: job chạy mỗi 60s nên booking hết hạn ngẫu nhiên được 1-60s.)
const EXPIRE_GRACE_MS = 60 * 1000

// Job: tự huỷ booking pending quá hạn cọc (chỉ online có expiresAt). Trả về số lượng đã huỷ.
exports.expirePendingBookings = async () => {
  const expired = await Booking.find({ status: 'pending', expiresAt: { $lt: new Date(Date.now() - EXPIRE_GRACE_MS) } })
  for (const b of expired) {
    b.cancelReason = 'payment_timeout'
    await exports.transition(b, 'cancelled', null, 'Tự huỷ: quá hạn thanh toán cọc')
    await HoldRoom.deleteMany({ booking: b._id })
    // Realtime: khách đang ngồi ở trang thanh toán -> báo hết hạn để FE đưa về chọn phòng.
    try {
      const { getIO } = require('../config/socket')
      getIO().emit('booking_expired', { bookingId: b._id, groupId: b.group || null })
    } catch (e) { console.warn('[expire] socket emit lỗi:', e.message) }
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

// ── UC-37: ĐỔI PHÒNG cả nhóm (walk-in re-select) ─────────────────────────────
// Lễ tân chọn lại DÀN PHÒNG mới (1 hay nhiều, cùng/khác loại). Kế toán CẮT MỐC tại hôm nay:
// dàn cũ khoá tiền các đêm ĐÃ NGỦ, dàn mới tính các đêm CÒN LẠI. Tiền đã trả giữ nguyên trên
// từng booking -> cộng dồn ở cấp nhóm thành TÍN DỤNG; remaining nhóm âm = cần hoàn khách.
//
// 3 loại phòng sau khi so dàn cũ vs mới:
//   GIỮ  (cũ ∩ mới): tách sổ, KHÔNG dọn, khách ở tiếp.
//   BỎ   (cũ − mới): khoá tiền tới hôm nay, checked_out; lễ tân chọn giao HK dọn / để available.
//   MỚI  (mới − cũ): tạo booking mới, tính đêm còn lại, chia khách vào.
//
// Số khách giữ nguyên (group.adultsTotal/childrenTotal), chia lại vào DÀN MỚI bằng autoAllocate.
//
// Setup dùng chung cho PREVIEW và COMMIT: validate + chia khách + phân loại phòng.
// Preview và commit gọi CÙNG hàm này -> bảng xem trước không thể lệch với việc thực sự xảy ra.
async function _transferSetup(groupId, items) {
  const group = await getGroupOr404(groupId)
  const branch = await Branch.findById(group.branch)
  if (!branch) throw new Error('Không tìm thấy chi nhánh')

  // Chỉ đổi các phòng ĐANG Ở. Phòng đã trả/huỷ trong nhóm không tính.
  const current = await Booking.find({ group: groupId, status: 'checked_in' }).populate('room')
  if (!current.length) throw new Error('Nhóm không có phòng nào đang ở để đổi')

  const boundary = startOfDay(new Date())                       // mốc cắt = hôm nay (tính đêm theo DATE)
  const checkOut = current[0].checkOut
  if (nightsBetween(boundary, checkOut) < 1) throw new Error('Khách trả phòng trong hôm nay — dùng Trả phòng, không đổi phòng')

  if (!Array.isArray(items) || !items.length) throw new Error('Chọn ít nhất 1 phòng cho dàn mới')
  const newIds = items.map((it) => String(it.roomId))
  if (new Set(newIds).size !== newIds.length) throw new Error('Có phòng bị chọn trùng trong dàn mới')

  // Nạp + validate phòng mới. Trùng phòng: overlap [hôm nay → trả] nhưng LOẠI TRỪ nhóm mình
  // (phòng GIỮ chính là booking checked_in của nhóm này -> không được coi là "bận").
  const newRooms = []
  for (const id of newIds) {
    const room = await Room.findOne({ _id: id, isDeleted: { $ne: true } }).populate('roomType')
    if (!room) throw new Error('Phòng không tồn tại')
    if (String(room.branch) !== String(branch._id)) throw new Error(`Phòng ${room.roomNumber} không thuộc chi nhánh`)
    if (['maintenance', 'locked'].includes(room.status)) throw new Error(`Phòng ${room.roomNumber} đang ${room.status}`)
    if (!room.roomType || room.roomType.status !== 'active') throw new Error(`Loại phòng của phòng ${room.roomNumber} không khả dụng`)
    const clash = await Booking.countDocuments({
      room: room._id, status: { $in: OCCUPYING }, group: { $ne: group._id },
      checkIn: { $lt: checkOut }, checkOut: { $gt: boundary },
    })
    if (clash) throw new Error(`Phòng ${room.roomNumber} đã có khách khác đặt trong thời gian còn lại`)
    newRooms.push(room)
  }

  // Chia LẠI đúng số khách của nhóm vào dàn mới (mỗi phòng ≥ 1 người lớn).
  const A = group.adultsTotal || current.reduce((s, b) => s + b.adults, 0)
  const C = group.childrenTotal || current.reduce((s, b) => s + b.children, 0)
  if (A < newRooms.length) throw new Error(`Cần ít nhất ${newRooms.length} người lớn cho ${newRooms.length} phòng`)
  const alloc = exports.autoAllocate(A, C, newRooms.map((r) => ({
    roomId: String(r._id), capacity: r.roomType.capacity, extraBedFee: r.roomType.extraBedFee || 0,
  })))
  const allocByRoom = Object.fromEntries(alloc.map((a) => [String(a.roomId), a]))

  const curByRoom = Object.fromEntries(current.map((b) => [String(b.room._id), b]))
  const keptIds = new Set(newIds.filter((id) => curByRoom[id]))       // cũ ∩ mới
  const droppedMembers = current.filter((b) => !newIds.includes(String(b.room._id))) // cũ − mới
  const addedRooms = newRooms.filter((r) => !curByRoom[String(r._id)])               // mới − cũ
  return { group, branch, current, boundary, checkOut, newRooms, allocByRoom, curByRoom, keptIds, droppedMembers, addedRooms }
}

// Tiền một CHẶNG MỚI của 1 phòng (phòng giữ / phòng mới): tiền phòng + phụ phí giường phụ cho [từ → trả].
async function _segmentCharge(roomType, from, to, adults, children) {
  const roomCharge = await computeRoomCharge(roomType, from, to)
  const occ = computeOccupancy(roomType, adults, children)
  const bedSurcharge = occ.extraBeds * (roomType.extraBedFee || 0) * nightsBetween(from, to)
  return { roomCharge, bedSurcharge, extraBeds: occ.extraBeds }
}

// PREVIEW: cho lễ tân thấy TRƯỚC khi bấm — tổng mới, đã trả, cần thu thêm / cần hoàn.
// Tính bằng recalcBill trên bản SAO (không ghi) -> con số khớp y hệt lúc commit.
exports.previewTransferGroup = async (groupId, { items } = {}) => {
  const s = await _transferSetup(groupId, items)
  const clone = (b) => new Booking(b.toObject ? b.toObject() : b)
  let total = 0, paid = 0
  const rooms = []
  for (const b of s.current) {
    const rt = await RoomType.findById(b.roomType)
    const segStart = b.roomSegmentStart || b.checkIn
    const slept = await computeRoomCharge(rt, segStart, s.boundary)
    const occSlept = computeOccupancy(rt, b.adults, b.children)
    const sleptBed = b.bedSurchargeApplied ? occSlept.extraBeds * (rt.extraBedFee || 0) * nightsBetween(segStart, s.boundary) : 0
    const c = clone(b)
    c.roomChargeLocked = (b.roomChargeLocked || 0) + slept
    c.bedSurchargeLocked = (b.bedSurchargeLocked || 0) + sleptBed
    const kept = s.keptIds.has(String(b.room._id))
    if (kept) {
      const a = s.allocByRoom[String(b.room._id)]
      const seg = await _segmentCharge(rt, s.boundary, s.checkOut, a.adults, a.children)
      c.roomCharge = seg.roomCharge; c.bedSurcharge = seg.bedSurcharge; c.bedSurchargeApplied = seg.extraBeds > 0
    } else {
      c.roomCharge = 0; c.bedSurcharge = 0
    }
    recalcBill(c)
    total += c.totalAmount; paid += (b.paidAmount || 0)
    rooms.push({ roomNumber: b.room.roomNumber, kind: kept ? 'kept' : 'dropped', total: c.totalAmount })
  }
  for (const room of s.addedRooms) {
    const a = s.allocByRoom[String(room._id)]
    const seg = await _segmentCharge(room.roomType, s.boundary, s.checkOut, a.adults, a.children)
    const c = new Booking({ branch: s.branch._id, roomType: room.roomType._id, checkIn: s.boundary, checkOut: s.checkOut, roomSegmentStart: s.boundary, roomCharge: seg.roomCharge, bedSurcharge: seg.bedSurcharge, bedSurchargeApplied: seg.extraBeds > 0 })
    recalcBill(c)
    total += c.totalAmount
    rooms.push({ roomNumber: room.roomNumber, kind: 'added', total: c.totalAmount })
  }
  const remaining = total - paid
  return {
    kept: s.keptIds.size, dropped: s.droppedMembers.length, added: s.addedRooms.length,
    droppedRooms: s.droppedMembers.map((b) => ({ bookingId: b._id, roomNumber: b.room.roomNumber })),
    newTotal: total, paid, remaining,
    collectMore: remaining > 0 ? remaining : 0,   // dương = còn thu thêm lúc trả phòng
    refundDue: remaining < 0 ? -remaining : 0,    // âm = cần hoàn khách
  }
}

// items: [{ roomId }]  — dàn phòng mới (số khách backend tự chia).
// vacate: { [bookingId]: 'clean' | 'available' } — cách xử phòng BỎ (mặc định 'clean' để có kiểm kê bắt đồ hỏng).
exports.transferGroup = async (groupId, { items, vacate = {}, by } = {}) => {
  const { group, branch, current, boundary, checkOut, allocByRoom, curByRoom, keptIds, droppedMembers, addedRooms } = await _transferSetup(groupId, items)

  // Khoá tiền chặng ĐÃ NGỦ của 1 member (từ segmentStart tới hôm nay).
  const lockPast = async (b) => {
    const segStart = b.roomSegmentStart || b.checkIn
    const rt = await RoomType.findById(b.roomType)
    const sleptCharge = await computeRoomCharge(rt, segStart, boundary)
    const sleptNights = nightsBetween(segStart, boundary)
    const occ = computeOccupancy(rt, b.adults, b.children)
    const sleptSurcharge = b.bedSurchargeApplied ? occ.extraBeds * (rt.extraBedFee || 0) * sleptNights : 0
    b.roomChargeLocked = (b.roomChargeLocked || 0) + sleptCharge
    b.bedSurchargeLocked = (b.bedSurchargeLocked || 0) + sleptSurcharge
    return rt
  }

  const codes = []
  for (let i = 0; i < addedRooms.length; i++) codes.push(await genBookingCode(branch.code))

  const hk = require('./housekeepingService')
  // Tự phân HK cho các phòng BỎ cần dọn (giống checkOutGroup) — theo tầng + tải việc.
  const toClean = droppedMembers.filter((b) => (vacate[String(b._id)] || 'clean') === 'clean')
  let assign = {}
  if (toClean.length) {
    assign = await autoAssignHousekeepers(branch._id, toClean.map((b) => ({
      bookingId: b._id, roomId: b.room._id, floor: b.room.floor,
    }))) || {}
  }

  const result = await runInTransaction(async (session) => {
    // 1) PHÒNG GIỮ: khoá chặng cũ, mở chặng mới từ hôm nay, chia khách mới.
    for (const id of keptIds) {
      const b = curByRoom[id]
      const rt = await lockPast(b)
      const a = allocByRoom[id]
      b.roomSegmentStart = boundary
      b.adults = a.adults; b.children = a.children; b.guests = a.adults + a.children
      b.roomCharge = await computeRoomCharge(rt, boundary, checkOut)
      const occ = computeOccupancy(rt, a.adults, a.children)
      b.bedSurcharge = occ.extraBeds * (rt.extraBedFee || 0) * nightsBetween(boundary, checkOut)
      b.bedSurchargeApplied = occ.extraBeds > 0     // hệ thống tự quyết theo phòng mới; lễ tân đè sau
      recalcBill(b)
      await b.save({ session })
      await logStatus(b._id, 'checked_in', 'checked_in', by, `Đổi phòng: giữ ${b.room.roomNumber}, tách chặng`)
    }

    // 2) PHÒNG BỎ: khoá tiền tới hôm nay, chặng hiện tại về 0, checked_out.
    for (const b of droppedMembers) {
      await lockPast(b)
      b.roomCharge = 0; b.bedSurcharge = 0
      b.status = 'checked_out'
      recalcBill(b)
      await b.save({ session })
      const mode = vacate[String(b._id)] || 'clean'
      if (mode === 'available') {
        await Room.updateOne({ _id: b.room._id }, { status: 'available' }, { session })
      } else {
        await Room.updateOne({ _id: b.room._id }, { status: 'cleaning' }, { session })
      }
      await logStatus(b._id, 'checked_in', 'checked_out', by, `Đổi phòng: rời ${b.room.roomNumber} (${mode === 'available' ? 'để trống luôn' : 'giao dọn'})`)
    }

    // 3) PHÒNG MỚI: tạo booking checked_in, tính đêm còn lại từ hôm nay.
    const created = []
    for (let i = 0; i < addedRooms.length; i++) {
      const room = addedRooms[i]
      const a = allocByRoom[String(room._id)]
      const roomCharge = await computeRoomCharge(room.roomType, boundary, checkOut)
      const occ = computeOccupancy(room.roomType, a.adults, a.children)
      const bedSurcharge = occ.extraBeds * (room.roomType.extraBedFee || 0) * nightsBetween(boundary, checkOut)
      const [nb] = await Booking.create([{
        code: codes[i], group: group._id, branch: branch._id, roomType: room.roomType._id, room: room._id,
        customer: group.customer, guestName: group.guestName, guestPhone: group.guestPhone,
        checkIn: boundary, checkOut, roomSegmentStart: boundary,
        guests: a.adults + a.children, adults: a.adults, children: a.children,
        source: group.source, status: 'checked_in', paymentStatus: 'unpaid',
        roomCharge, bedSurcharge, bedSurchargeApplied: occ.extraBeds > 0,
        totalAmount: 0, paidAmount: 0, remainingAmount: 0, createdBy: by,
      }], { session })
      recalcBill(nb); await nb.save({ session })
      await Room.updateOne({ _id: room._id }, { status: 'occupied' }, { session })
      await BookingStatusHistory.create([{ booking: nb._id, fromStatus: null, toStatus: 'checked_in', changedBy: by, note: `Đổi phòng: nhận thêm ${room.roomNumber}` }], { session })
      created.push(nb)
    }
    return { created }
  })

  // Giao HK dọn phòng bỏ (ngoài transaction — notify không được làm hỏng luồng tiền).
  for (const b of toClean) {
    try { await hk.createTurnover(b._id, b.room._id, assign[String(b._id)]) }
    catch (e) { console.warn('[transferGroup] createTurnover lỗi:', e.message) }
  }

  // Cập nhật realtime cho màn đang mở
  try {
    const { emitBookingUpdated } = require('../config/socket')
    for (const b of current) emitBookingUpdated(b._id)
    for (const b of result.created) emitBookingUpdated(b._id)
  } catch { /* ignore */ }

  // Tổng hợp lại nhóm (LIVE) để trả về + biết có cần hoàn không
  const members = await Booking.find({ group: groupId })
  const roll = groupRollup(members)
  return {
    kept: keptIds.size, dropped: droppedMembers.length, added: result.created.length,
    cleaned: toClean.length, availableNow: droppedMembers.length - toClean.length,
    groupTotal: roll.totalAmount, groupPaid: roll.paidAmount, groupRemaining: roll.remainingAmount,
    refundDue: roll.remainingAmount < 0 ? -roll.remainingAmount : 0,   // âm = cần hoàn khách
  }
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
    booking.adults = newAdults; booking.children = newChildren; booking.guests = newAdults + newChildren
    // Phụ phí giường phụ tính cho CHẶNG HIỆN TẠI (đổi phòng cắt mốc); chưa đổi -> segmentStart = checkIn -> cả kỳ
    const nights = nightsBetween(segmentStart(booking), booking.checkOut)
    booking.bedSurcharge = occ.extraBeds * (roomType.extraBedFee || 0) * nights
    recalcBill(booking) // nếu bedSurchargeApplied thì total cập nhật theo
    await refreshPendingDeposit(booking)
  }
  await booking.save()
  return booking
}

// TODO(Quốc) GĐ5: room schedule/timeline (UC-39/40), transactions (UC-41/42).
