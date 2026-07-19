// Owner: Quốc — Receptionist read logic (UC-26/27/28/43). Scope theo chi nhánh được gán (BR-30).
const Booking = require('../models/bookingModel')
const BookingGroup = require('../models/bookingGroupModel')
const Room = require('../models/roomModel')
const Payment = require('../models/paymentModel')
const BookingStatusHistory = require('../models/bookingStatusHistoryModel')
const RoleAssignment = require('../models/roleAssignmentModel')
const Service = require('../models/serviceModel')
const Amenity = require('../models/amenityModel')
const bookingService = require('./bookingService')
const housekeepingService = require('./housekeepingService')
const contactService = require('./contactService')

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

// UC-27/43: danh sách + lọc theo NHÓM (mọi lần đặt = 1 nhóm). Mỗi dòng = 1 nhóm + rollup tiền/trạng thái.
// view='active' (mặc định): mọi đơn TRỪ huỷ/no-show (gồm cả online lẫn walk-in chờ cọc).
// view='archived': CHỈ đơn đã huỷ/no-show (tab riêng). Lọc thêm: status (rollup), date (ngày nhận), q (mã/tên/sđt).
exports.listBookings = async (accountId, { status, date, q, view } = {}) => {
  const branches = await myBranchIds(accountId)
  const gfilter = { branch: { $in: branches } }
  if (date) {
    const d0 = new Date(date); d0.setHours(0, 0, 0, 0)
    gfilter.checkIn = { $gte: d0, $lt: new Date(d0.getTime() + 86400000) }
  }
  if (q) gfilter.$or = [
    { code: new RegExp(q, 'i') },
    { guestName: new RegExp(q, 'i') },
    { guestPhone: new RegExp(q, 'i') },
  ]
  const groups = await BookingGroup.find(gfilter)
    .populate({ path: 'customer', select: 'fullName phone' })
    .sort('-createdAt').lean()
  const members = await Booking.find({ group: { $in: groups.map((g) => g._id) } })
    .populate('room', 'roomNumber').populate('roomType', 'name')
    .select('group status totalAmount paidAmount remainingAmount depositAmount room roomType transferredOut')
    .lean()
  const byGroup = {}
  members.forEach((m) => { (byGroup[String(m.group)] = byGroup[String(m.group)] || []).push(m) })

  let rows = groups.map((g) => {
    const ms = byGroup[String(g._id)] || []
    const roll = bookingService.groupRollup(ms)
    return {
      _id: g._id, code: g.code, source: g.source,
      guestName: g.guestName, guestPhone: g.guestPhone, customer: g.customer,
      checkIn: g.checkIn, checkOut: g.checkOut, createdAt: g.createdAt,
      // Ẩn phòng đã đổi đi khỏi thẻ danh sách — chỉ hiện dàn phòng hiện tại.
      roomNumbers: ms.filter((m) => !m.transferredOut).map((m) => m.room?.roomNumber).filter(Boolean),
      roomTypeNames: [...new Set(ms.filter((m) => !m.transferredOut).map((m) => m.roomType?.name).filter(Boolean))],
      ...roll, // status, roomCount, activeCount, totalAmount, paidAmount, remainingAmount, paymentStatus, depositAmount
    }
  })

  const TERMINAL = ['cancelled', 'no_show']
  if (view === 'archived') {
    rows = rows.filter((r) => TERMINAL.includes(r.status))
    if (status && TERMINAL.includes(status)) rows = rows.filter((r) => r.status === status)
  } else {
    // active: chỉ bỏ huỷ/no-show (giữ mọi đơn chờ cọc — walk-in cần thu cọc, online chờ khách trả)
    rows = rows.filter((r) => !TERMINAL.includes(r.status))
    if (status) rows = rows.filter((r) => r.status === status)
  }
  return rows
}

// UC-28: chi tiết booking (dữ liệu cho màn 3 tab: thông tin / thiết bị / bill)
exports.getBookingDetail = async (accountId, bookingId) => {
  const branches = await myBranchIds(accountId)
  const booking = await Booking.findOne({ _id: bookingId, branch: { $in: branches } })
    .populate('roomType', 'name basePrice')
    .populate('room', 'roomNumber floor status awaitingRestock')
    .populate({ path: 'customer', select: 'fullName phone idCard' })
    .populate('group', 'code') // mã nhóm cho breadcrumb; FE cần b.group.code chứ không chỉ id
    .lean()
  if (!booking) { const e = new Error('Không tìm thấy booking trong chi nhánh của bạn'); e.status = 404; throw e }
  // Các phòng CÙNG NHÓM -> lễ tân nhảy thẳng sang phòng khác ngay trên trang này,
  // thay vì thoát ra nhóm rồi bấm "Mở →" lại từ đầu.
  let siblings = []
  if (booking.group) {
    siblings = await Booking.find({ group: booking.group._id || booking.group })
      .select('_id status room').populate('room', 'roomNumber floor').lean()
    // Sắp theo lộ trình phòng (tầng thấp -> cao) — sort() của Mongo không đi vào field populate được.
    siblings.sort((a, b2) => (a.room?.floor ?? 0) - (b2.room?.floor ?? 0)
      || String(a.room?.roomNumber || '').localeCompare(String(b2.room?.roomNumber || ''), 'vi', { numeric: true }))
  }
  const payments = await Payment.find({ booking: bookingId }).sort('createdAt').lean()
  const history = await BookingStatusHistory.find({ booking: bookingId }).sort('createdAt').lean()
  // Phòng chưa sẵn sàng thì cho lễ tân biết AI đang dọn ngay tại đây — để chủ động gọi giục,
  // thay vì bấm Check-in rồi mới nhận lỗi "phòng đang cleaning". Task này thuộc khách TRƯỚC, không phải booking này.
  let roomCleaning = null
  if (booking.room && booking.room.status !== 'available') {
    const map = await housekeepingService.roomCleaningInfo([booking.room._id])
    roomCleaning = map[String(booking.room._id)] || null
  }
  return { booking, payments, history, roomCleaning, siblings }
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
  const rooms = await bookingService.searchAvailableRooms(
    branches[0], q.checkIn, q.checkOut,
    Number(q.adults) || 1, Number(q.children) || 0,
    { roomTypeId: q.roomTypeId || undefined }
  )
  // searchAvailableRooms lọc theo LỊCH booking, không theo trạng thái vật lý -> phòng đang dọn vẫn hiện ra.
  // Đặt cho tương lai thì không sao (dọn xong từ lâu), nhưng NHẬN NGAY HÔM NAY thì lễ tân phải biết trước
  // phòng nào chưa sẵn sàng + ai đang dọn, thay vì chọn xong tới lúc check-in mới ăn lỗi.
  // Chỉ gắn khi nhận trong hôm nay — đặt cho mai trở đi thì thông tin này là nhiễu.
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday); endOfToday.setDate(endOfToday.getDate() + 1)
  const ci = new Date(q.checkIn)
  if (!(ci >= startOfToday && ci < endOfToday)) return rooms

  const ids = rooms.map((r) => r.roomId)
  const [live, cleaning] = await Promise.all([
    Room.find({ _id: { $in: ids } }).select('status awaitingRestock').lean(),
    housekeepingService.roomCleaningInfo(ids),
  ])
  const statusById = Object.fromEntries(live.map((r) => [String(r._id), r]))
  return rooms.map((r) => {
    const s = statusById[String(r.roomId)]
    return { ...r, roomStatus: s?.status, awaitingRestock: !!s?.awaitingRestock, cleaning: cleaning[String(r.roomId)] || null }
  })
}

// UC-29: walk-in — lễ tân chọn PHÒNG cụ thể + dịch vụ kèm.
// Mọi lần đặt = 1 nhóm: walk-in 1 phòng cũng đi qua createGroup (1 item) cho nhất quán.
exports.walkIn = async (accountId, body) => {
  const branches = await myBranchIds(accountId)
  return bookingService.createGroup({
    branchId: branches[0],
    guestName: body.guestName, guestPhone: body.guestPhone,
    checkIn: body.checkIn, checkOut: body.checkOut,
    items: [{ roomId: body.roomId, adults: body.adults, children: body.children, services: body.services }],
    adultsTotal: body.adults, childrenTotal: body.children,
    source: 'walk_in', createdBy: accountId,
  })
}

// ---------- UC-29 (mở rộng): ĐẶT NHIỀU PHÒNG cho cùng nhóm khách ----------
async function assertGroupInBranch(accountId, groupId) {
  const branches = await myBranchIds(accountId)
  const ok = await BookingGroup.exists({ _id: groupId, branch: { $in: branches } })
  if (!ok) { const e = new Error('Không tìm thấy nhóm trong chi nhánh của bạn'); e.status = 404; throw e }
}

// Báo giá nhóm realtime cho các phòng đã chọn — hệ thống tự chia khách (lễ tân không chia tay).
exports.quoteGroup = async (accountId, body = {}) => {
  const branches = await myBranchIds(accountId)
  if (!body.checkIn || !body.checkOut) throw new Error('Thiếu ngày nhận/trả')
  return bookingService.quoteGroup(branches[0], body.checkIn, body.checkOut, body.items || [], body.adultsTotal, body.childrenTotal)
}

// Tạo nhóm nhiều phòng (mỗi phòng 1 booking, gom 1 mã + 1 cọc)
exports.createGroup = async (accountId, body = {}) => {
  const branches = await myBranchIds(accountId)
  return bookingService.createGroup({
    branchId: branches[0],
    guestName: body.guestName, guestPhone: body.guestPhone,
    checkIn: body.checkIn, checkOut: body.checkOut,
    items: body.items, adultsTotal: body.adultsTotal, childrenTotal: body.childrenTotal,
    notes: body.notes, source: 'walk_in', createdBy: accountId,
  })
}

// Chi tiết nhóm (các phòng + 1 hoá đơn gom)
exports.getGroup = async (accountId, groupId) => {
  await assertGroupInBranch(accountId, groupId)
  const detail = await bookingService.getGroupDetail(groupId)
  // Gắn tình trạng dọn cho từng phòng để lễ tân thấy TRƯỚC khi bấm "Nhận tất cả",
  // thay vì bấm xong mới nhận báo "bỏ qua 1 phòng (đang cleaning)".
  // Bọc ở đây chứ KHÔNG nhét vào getGroupDetail: hàm đó customerController cũng gọi
  // -> khách sẽ thấy tên + lịch làm việc của nhân viên.
  const roomIds = detail.members.map((m) => m.room?._id).filter(Boolean)
  if (!roomIds.length) return detail
  const [live, cleaning] = await Promise.all([
    Room.find({ _id: { $in: roomIds } }).select('status awaitingRestock').lean(),
    housekeepingService.roomCleaningInfo(roomIds),
  ])
  const byId = Object.fromEntries(live.map((r) => [String(r._id), r]))
  detail.members = detail.members.map((m) => {
    if (!m.room) return m
    const s = byId[String(m.room._id)]
    return {
      ...m,
      room: { ...m.room, status: s?.status, awaitingRestock: !!s?.awaitingRestock },
      cleaning: cleaning[String(m.room._id)] || null,
    }
  })
  return detail
}

// Thu cọc gom cho cả nhóm -> mọi phòng pending chuyển confirmed
exports.confirmGroupDeposit = async (accountId, groupId, body = {}) => {
  await assertGroupInBranch(accountId, groupId)
  return bookingService.confirmGroupDeposit(groupId, { method: body.method, transactionCode: body.transactionCode, paidFull: !!body.paidFull, by: accountId })
}

// Thao tác hàng loạt cả nhóm: nhận / trả (tự phân HK + thu gom) / huỷ / no-show — áp cho các phòng đủ điều kiện.
exports.checkInGroup = async (accountId, groupId) => {
  await assertGroupInBranch(accountId, groupId)
  return bookingService.checkInGroup(groupId, { by: accountId })
}
exports.checkOutGroup = async (accountId, groupId, body = {}) => {
  await assertGroupInBranch(accountId, groupId)
  // assignees: lễ tân đổi người dọn cho vài phòng; phòng không gửi lên thì giữ người auto chọn.
  return bookingService.checkOutGroup(groupId, { by: accountId, method: body.method, assignees: body.assignees })
}
// Xem trước khi trả cả nhóm: phòng nào, AI sẽ được giao dọn, thu bao nhiêu — để lễ tân biết trước khi bấm.
exports.previewCheckOutGroup = async (accountId, groupId) => {
  await assertGroupInBranch(accountId, groupId)
  return bookingService.previewCheckOutGroup(groupId)
}
exports.cancelGroupAll = async (accountId, groupId, body = {}) => {
  await assertGroupInBranch(accountId, groupId)
  return bookingService.cancelGroupAll(groupId, { reason: body.reason, by: accountId })
}
exports.noShowGroup = async (accountId, groupId) => {
  await assertGroupInBranch(accountId, groupId)
  return bookingService.noShowGroup(groupId, { by: accountId })
}

// Gen QR PayOS GOM cho cả nhóm: deposit (cọc) | full (toàn bộ) | remaining (tiền còn lại khi trả phòng)
exports.createGroupQR = async (accountId, groupId, body = {}) => {
  await assertGroupInBranch(accountId, groupId)
  const group = await BookingGroup.findById(groupId)
  if (!group) { const e = new Error('Không tìm thấy nhóm'); e.status = 404; throw e }
  const type = ['deposit', 'full', 'remaining'].includes(body.type) ? body.type : 'deposit'
  // Trả phòng bằng QR: checkOutGroup sẽ do WEBHOOK PayOS gọi, không đi qua màn hình nữa
  // -> phải cất người dọn lễ tân vừa chọn vào nhóm ngay bây giờ, lát webhook đọc lại.
  if (type === 'remaining' && body.assignees && Object.keys(body.assignees).length) {
    const hk = require('./housekeepingService')
    for (const [, hkId] of Object.entries(body.assignees)) {
      if (hkId) await hk.assertHousekeeperInBranch(hkId, group.branch) // sai người thì hỏng NGAY, đừng để webhook mới lỗi
    }
    group.cleaningAssignees = body.assignees
    await group.save()
  }
  return require('./payosService').createGroupQR(group, type, accountId)
}
// Polling PayOS cho nhóm (fallback khi webhook không tới localhost)
exports.syncGroupPayments = async (accountId, groupId) => {
  await assertGroupInBranch(accountId, groupId)
  return require('./payosService').syncGroupPayments(groupId)
}

exports.confirmDeposit = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.confirmDeposit(bookingId, { method: body.method, transactionCode: body.transactionCode, paidFull: !!body.paidFull, by: accountId })
}

// Gen QR PayOS cho booking pending: 'deposit' (cọc) hoặc 'full' (thu toàn bộ 1 lần)
exports.createDepositQR = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  const booking = await Booking.findById(bookingId)
  if (!booking) { const e = new Error('Không tìm thấy booking'); e.status = 404; throw e }
  if (booking.status !== 'pending') throw new Error('Chỉ tạo QR cọc khi booking đang chờ (pending)')
  const payosService = require('./payosService')
  return payosService.createQR(booking, body.type === 'full' ? 'full' : 'deposit', accountId)
}
exports.checkIn = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.checkIn(bookingId, { by: accountId })
}
exports.checkOut = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  // Bắt buộc giao housekeeper cho task dọn turnover; validate TRƯỚC khi check-out (tránh trạng thái dở)
  const booking = await Booking.findById(bookingId).select('branch')
  await housekeepingService.assertHousekeeperInBranch(body.housekeeperId, booking.branch)
  return bookingService.checkOut(bookingId, { method: body.method, by: accountId, housekeeperId: body.housekeeperId })
}

// Gen QR PayOS để thu remaining khi check-out (lễ tân chọn phương thức QR)
exports.createCheckoutQR = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  const booking = await Booking.findById(bookingId)
  if (!booking) { const e = new Error('Không tìm thấy booking'); e.status = 404; throw e }
  if (booking.status !== 'checked_in') throw new Error('Chỉ tạo QR checkout khi khách đang ở')
  const payosService = require('./payosService')
  return payosService.createQR(booking, 'remaining', accountId)
}

// Check-out bằng tiền mặt (lễ tân xác nhận trực tiếp, không QR)
exports.checkOutCash = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  const booking = await Booking.findById(bookingId).select('branch')
  await housekeepingService.assertHousekeeperInBranch(body.housekeeperId, booking.branch)
  return bookingService.checkOut(bookingId, { method: 'cash', by: accountId, housekeeperId: body.housekeeperId })
}
exports.complete = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.complete(bookingId, { by: accountId })
}
// Polling: gọi PayOS API kiểm tra payment đã thành công chưa (fallback khi webhook không tới localhost)
exports.syncPayments = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  const payosService = require('./payosService')
  return payosService.syncBookingPayments(bookingId)
}
exports.setBedSurcharge = async (accountId, bookingId, apply) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.setBedSurcharge(bookingId, apply, accountId)
}
exports.setEarlyCheckin = async (accountId, bookingId, hours) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.setEarlyCheckin(bookingId, hours, accountId)
}
exports.setLateCheckout = async (accountId, bookingId, hours) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.setLateCheckout(bookingId, hours, accountId)
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

// Bảng triển khai dịch vụ theo phòng — chỉ phòng đang có khách (checked_in), gom theo phòng
exports.getServiceBoard = async (accountId) => {
  const branches = await myBranchIds(accountId)
  const bookings = await Booking.find({
    branch: { $in: branches },
    status: 'checked_in',
    'services.0': { $exists: true }, // có ít nhất 1 dịch vụ
  }).populate('room', 'roomNumber floor').select('code guestName customer room services').lean()
  const rows = bookings
    .filter((b) => b.room) // bỏ booking chưa gán phòng (an toàn)
    .map((b) => {
      const services = b.services.map((s) => ({
        _id: s._id, name: s.name, quantity: s.quantity, price: s.price,
        addedAt: s.addedAt, status: s.status || 'pending', deliveredAt: s.deliveredAt,
      }))
      return {
        bookingId: b._id, code: b.code, guestName: b.guestName,
        room: b.room, // { _id, roomNumber, floor }
        services,
        pendingCount: services.filter((s) => s.status !== 'delivered').length,
      }
    })
    .sort((a, b) => String(a.room.roomNumber).localeCompare(String(b.room.roomNumber), 'vi', { numeric: true }))
  return rows
}

// Toggle trạng thái triển khai 1 dòng dịch vụ (đã giao ⇄ chưa giao)
exports.setServiceDelivered = async (accountId, bookingId, lineId, delivered) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.setServiceDelivered(bookingId, lineId, !!delivered, accountId)
}

// ---------- Housekeeping: yêu cầu kiểm tra / dọn phòng (giao task cho housekeeper) ----------
// UC: lễ tân "Yêu cầu kiểm tra phòng" trước khi khách trả -> task inspection (claimable + thông báo).
exports.requestInspection = async (accountId, bookingId, housekeeperId) => {
  await assertInBranch(accountId, bookingId)
  const booking = await Booking.findById(bookingId).select('status room')
  if (!booking.room) throw new Error('Booking chưa được gán phòng')
  if (booking.status !== 'checked_in') throw new Error('Chỉ yêu cầu kiểm tra khi khách đang ở (checked_in)')
  return housekeepingService.createInspection(bookingId, booking.room, accountId, housekeeperId)
}
// UC: lễ tân "Dọn phòng" theo yêu cầu khách (giữa kỳ) -> task mid_stay (miễn phí).
exports.requestCleaning = async (accountId, bookingId, housekeeperId) => {
  await assertInBranch(accountId, bookingId)
  const booking = await Booking.findById(bookingId).select('status room')
  if (!booking.room) throw new Error('Booking chưa được gán phòng')
  if (booking.status !== 'checked_in') throw new Error('Chỉ dọn phòng khi khách đang ở (checked_in)')
  return housekeepingService.createMidStay(bookingId, booking.room, accountId, housekeeperId)
}
// Trạng thái + lịch sử housekeeping của booking (cho nút + lịch sử ở màn chi tiết lễ tân).
exports.getBookingHousekeeping = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  return housekeepingService.bookingView(bookingId)
}
// Gợi ý housekeeper để giao việc (theo tầng phòng + rảnh/bận).
exports.getHousekeeperSuggestions = async (accountId, bookingId) => {
  await assertInBranch(accountId, bookingId)
  const booking = await Booking.findById(bookingId).populate('room', 'floor').lean()
  return housekeepingService.suggestHousekeepers(booking.branch, booking?.room?.floor ?? null)
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
// UC-37: đổi phòng CẢ NHÓM (chọn lại dàn phòng kiểu walk-in). Xem trước tiền rồi mới xác nhận.
exports.previewTransferGroup = async (accountId, groupId, body = {}) => {
  await assertGroupInBranch(accountId, groupId)
  return bookingService.previewTransferGroup(groupId, { items: body.items })
}
exports.transferGroup = async (accountId, groupId, body = {}) => {
  await assertGroupInBranch(accountId, groupId)
  return bookingService.transferGroup(groupId, { items: body.items, vacate: body.vacate, assignees: body.assignees, by: accountId })
}
exports.update = async (accountId, bookingId, body = {}) => {
  await assertInBranch(accountId, bookingId)
  return bookingService.updateBooking(bookingId, { ...body, by: accountId })
}

// ---------- Hộp thư liên hệ (khách gửi từ trang Contact) ----------
exports.listContacts = async (accountId, query = {}) => {
  const branches = await myBranchIds(accountId)
  return contactService.listForBranches(branches, { status: query.status })
}
exports.handleContact = async (accountId, id) => {
  const branches = await myBranchIds(accountId)
  return contactService.markHandled(id, branches, accountId)
}

// ---------- Dashboard: thông số trong ngày của lễ tân ----------
exports.getDashboard = async (accountId) => {
  const branches = await myBranchIds(accountId)
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86400000)
  const today = { $gte: dayStart, $lt: dayEnd }
  const inBranch = { branch: { $in: branches } }

  const pop = (q) => q
    .populate('roomType', 'name').populate('room', 'roomNumber')
    .populate({ path: 'customer', select: 'fullName phone' })

  const [arrivals, departures, inHouse, pendingCount, roomsTotal, roomsAvailable, roomsOccupied] = await Promise.all([
    // Khách dự kiến NHẬN hôm nay (chưa nhận)
    pop(Booking.find({ ...inBranch, checkIn: today, status: { $in: ['pending', 'confirmed'] } })).sort('checkIn').lean(),
    // Khách dự kiến TRẢ hôm nay (đang ở)
    pop(Booking.find({ ...inBranch, checkOut: today, status: 'checked_in' })).sort('checkOut').lean(),
    Booking.countDocuments({ ...inBranch, status: 'checked_in' }),
    Booking.countDocuments({ ...inBranch, status: 'pending' }),
    Room.countDocuments({ ...inBranch, isDeleted: { $ne: true } }),
    Room.countDocuments({ ...inBranch, isDeleted: { $ne: true }, status: 'available' }),
    Room.countDocuments({ ...inBranch, isDeleted: { $ne: true }, status: 'occupied' }),
  ])

  // Doanh thu hôm nay (các payment đã thu trong ngày, thuộc booking của chi nhánh)
  const bookingIds = await Booking.find(inBranch).distinct('_id')
  const pays = await Payment.find({ booking: { $in: bookingIds }, status: 'paid', paidAt: today }).select('amount').lean()
  const revenueToday = pays.reduce((s, p) => s + (p.amount || 0), 0)

  return {
    counts: {
      arrivalsToday: arrivals.length,
      departuresToday: departures.length,
      inHouse, pending: pendingCount,
      roomsAvailable, roomsOccupied, roomsTotal,
      revenueToday,
    },
    arrivals, departures,
  }
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
    status: { $in: ['pending', 'confirmed', 'checked_in', 'checked_out', 'completed'] },
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
