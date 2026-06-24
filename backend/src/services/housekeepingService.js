// Owner: Tu - Housekeeper workflows (UC-44 -> UC-55).
// Scope every read/write by active housekeeper RoleAssignment.
const RoleAssignment = require('../models/roleAssignmentModel')
const HousekeepingTask = require('../models/housekeepingTaskModel')
const Booking = require('../models/bookingModel')
const Room = require('../models/roomModel')
const RoomType = require('../models/roomTypeModel')
const RoomAmenity = require('../models/roomAmenityModel')
const Amenity = require('../models/amenityModel')
const RoomIssue = require('../models/roomIssueModel')
const bookingService = require('./bookingService')
const notificationService = require('./notificationService')

const ACTIVE_TASK_STATUSES = ['pending', 'in_progress', 'urgent']
const DONE_TASK_STATUSES = ['completed', 'missed']
// Escalation tự nhận: 2p chưa ai nhận -> nhắc HK; 5p -> báo manager + khoá tự nhận
const REMIND_AFTER_MS = 2 * 60 * 1000
const ESCALATE_AFTER_MS = 5 * 60 * 1000
exports.ESCALATE_AFTER_MS = ESCALATE_AFTER_MS

function fail(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

// Số phòng cho nội dung thông báo (best-effort).
async function roomLabel(roomId) {
  const r = await Room.findById(roomId).select('roomNumber').lean()
  return r ? r.roomNumber : ''
}
// Bọc notify để KHÔNG bao giờ làm hỏng luồng nghiệp vụ chính.
async function safeNotify(fn) {
  try { await fn() } catch (e) { console.warn('[notify]', e.message) }
}

async function myBranchIds(accountId) {
  const assignments = await RoleAssignment.find({
    account: accountId,
    role: 'housekeeper',
    isActive: true,
  }).select('branch -_id')
  const ids = assignments.map((a) => a.branch)
  if (!ids.length) fail('Tai khoan chua duoc gan chi nhanh housekeeper', 403)
  return ids
}
exports.myBranchIds = myBranchIds

function visibleTaskFilter(branches, accountId) {
  return {
    branch: { $in: branches },
    $or: [{ assignedTo: null }, { assignedTo: accountId }],
  }
}

function populateTask(query) {
  return query
    .populate('room', 'roomNumber floor status')
    .populate('booking', 'code guestName guestPhone checkIn checkOut status')
    .populate('assignedTo', 'email')
    .populate('assignedBy', 'email')
}

async function loadVisibleTask(accountId, taskId) {
  const branches = await myBranchIds(accountId)
  const task = await populateTask(HousekeepingTask.findOne({
    _id: taskId,
    ...visibleTaskFilter(branches, accountId),
  }))
  if (!task) fail('Khong tim thay task trong pham vi cua ban', 404)
  return task
}

// "Cần có" (expected) = SỐ CHUẨN theo loại phòng (RoomType.amenityStandards) — không lấy từ RoomAmenity nữa.
// "Thực tế" (actual) = số hiện có của phòng (RoomAmenity); chưa có bản ghi -> coi như đủ chuẩn.
async function buildAmenityReport(roomId, roomTypeId) {
  const roomType = await RoomType.findById(roomTypeId)
    .populate('amenities', 'name missingPrice status')
    .lean()

  // Số chuẩn theo từng amenity (amenityStandards lưu amenity dạng ObjectId)
  const stdQty = {}
  ;(roomType?.amenityStandards || []).forEach((s) => { if (s.amenity) stdQty[String(s.amenity)] = s.quantity })

  // Danh sách kiểm kê = amenity (active) của loại phòng; "Cần có" = số chuẩn (mặc định 1 nếu chưa set)
  const ras = await RoomAmenity.find({ room: roomId }).lean()
  const current = {}
  ras.forEach((ra) => { current[String(ra.amenity)] = ra })

  return (roomType?.amenities || [])
    .filter((a) => a && a.status !== 'inactive')
    .map((a) => {
      const expected = stdQty[String(a._id)] ?? 1
      const cur = current[String(a._id)]
      const actual = cur ? cur.quantity : expected
      return {
        amenity: a._id,
        name: a.name,
        expected,
        actual,
        missing: Math.max(0, expected - actual),
        condition: cur?.condition || 'active',
      }
    })
}

exports.listTasks = async (accountId, query = {}) => {
  const branches = await myBranchIds(accountId)
  const filter = visibleTaskFilter(branches, accountId)

  if (query.status) {
    if (!HousekeepingTask.TASK_STATUS.includes(query.status)) fail('Trang thai task khong hop le')
    filter.status = query.status
  } else {
    filter.status = { $in: ACTIVE_TASK_STATUSES }
  }

  if (query.assigned === 'mine') filter.assignedTo = accountId
  if (query.assigned === 'unassigned') filter.assignedTo = null
  if (query.room) filter.room = query.room

  return populateTask(HousekeepingTask.find(filter))
    .sort({ status: 1, isUrgent: -1, createdAt: 1 })
    .lean()
}

exports.getTaskDetail = async (accountId, taskId) => {
  return loadVisibleTask(accountId, taskId)
}

// "Ai nhanh hơn thì nhận" — claim ATOMIC (findOneAndUpdate) để 2 housekeeper bấm cùng lúc
// không thể cùng nhận 1 task (race condition). Chỉ match khi assignedTo còn null.
exports.claimTask = async (accountId, taskId) => {
  const branches = await myBranchIds(accountId)
  const claimed = await HousekeepingTask.findOneAndUpdate(
    // escalatedAt: null -> task đã chuyển quản lý (quá 5p) thì housekeeper KHÔNG tự nhận được nữa
    { _id: taskId, branch: { $in: branches }, assignedTo: null, escalatedAt: null, status: { $in: ACTIVE_TASK_STATUSES } },
    { $set: { assignedTo: accountId, assignedAt: new Date() } },
    { new: true }
  )
  if (claimed) {
    // Báo lễ tân đã yêu cầu: đã có người nhận việc (turnover không có requestedBy -> bỏ qua)
    if (claimed.requestedBy) {
      const rn = await roomLabel(claimed.room)
      await safeNotify(() => notificationService.notifyUser(claimed.requestedBy, {
        type: 'task_claimed', title: `Phòng ${rn}: housekeeper đã nhận việc`,
        body: 'Yêu cầu của bạn đang được xử lý', refType: 'task', refId: claimed._id, branch: claimed.branch,
      }))
    }
    return populateTask(HousekeepingTask.findById(claimed._id))
  }
  // Không claim được -> phân biệt lý do
  const existing = await HousekeepingTask.findOne({ _id: taskId, branch: { $in: branches } }).select('assignedTo status escalatedAt')
  if (!existing) fail('Khong tim thay task trong pham vi cua ban', 404)
  if (existing.assignedTo && String(existing.assignedTo) === String(accountId)) {
    return populateTask(HousekeepingTask.findById(taskId)) // mình đã nhận trước đó -> idempotent
  }
  if (existing.assignedTo) fail('Task da duoc nhan boi nhan vien khac')
  if (existing.escalatedAt) fail('Task đã quá hạn nhận, chỉ quản lý mới phân công được')
  fail('Khong the nhan task da ket thuc')
}

exports.startTask = async (accountId, taskId) => {
  const task = await loadVisibleTask(accountId, taskId)
  if (!task.assignedTo) fail('Ban can nhan task truoc khi bat dau')
  if (String(task.assignedTo._id || task.assignedTo) !== String(accountId)) fail('Ban khong phai nguoi duoc gan task nay', 403)
  if (!['pending', 'urgent'].includes(task.status)) fail('Chi task pending/urgent moi co the bat dau')
  task.status = 'in_progress'
  task.startedAt = task.startedAt || new Date()
  return task.save()
}

exports.saveAmenityReport = async (accountId, taskId, report = []) => {
  const task = await loadVisibleTask(accountId, taskId)
  if (task.type === 'mid_stay') fail('Task don phong giua ky khong can kiem ke thiet bi')
  if (DONE_TASK_STATUSES.includes(task.status)) fail('Khong the sua bao cao cua task da ket thuc')
  if (!task.assignedTo || String(task.assignedTo._id || task.assignedTo) !== String(accountId)) {
    fail('Ban can nhan task truoc khi luu bao cao', 403)
  }
  if (!Array.isArray(report)) fail('Bao cao thiet bi khong hop le')

  const branches = await myBranchIds(accountId)
  const normalized = []

  for (const row of report) {
    const amenityId = row.amenity || row.amenityId
    if (!amenityId) fail('Thieu amenity trong bao cao')
    const amenity = await Amenity.findOne({ _id: amenityId, branch: { $in: branches } })
    if (!amenity) fail('Amenity khong hop le hoac khong thuoc chi nhanh cua ban')

    const expected = Math.max(0, Number(row.expected) || 0)
    const actual = Math.max(0, Number(row.actual) || 0)
    const missing = Math.max(0, row.missing != null ? Number(row.missing) || 0 : expected - actual)
    const condition = ['active', 'broken', 'missing'].includes(row.condition) ? row.condition : (missing > 0 ? 'missing' : 'active')
    const previous = task.amenityReport.id(row._id) ||
      task.amenityReport.find((item) => String(item.amenity) === String(amenity._id))

    normalized.push({
      _id: previous?._id,
      amenity: amenity._id,
      name: amenity.name,
      expected,
      actual,
      missing,
      condition,
      note: row.note,
      chargedAt: previous?.chargedAt,
    })
  }

  task.amenityReport = normalized
  task.amenityChecked = true

  for (const row of task.amenityReport) {
    await RoomAmenity.findOneAndUpdate(
      { room: task.room._id || task.room, amenity: row.amenity },
      {
        room: task.room._id || task.room,
        amenity: row.amenity,
        quantity: row.actual,
        condition: row.missing > 0 ? 'missing' : row.condition,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  if (task.booking) {
    const booking = await Booking.findById(task.booking._id || task.booking).select('status')
    for (const row of task.amenityReport) {
      if (booking && ['confirmed', 'checked_in'].includes(booking.status) && row.missing > 0 && !row.chargedAt) {
        await bookingService.addMissingAmenity(task.booking._id || task.booking, row.amenity, row.missing, accountId)
        row.chargedAt = new Date()
      }
    }
  }

  await task.save()
  return task
}

exports.reportIssue = async (accountId, taskId, body = {}) => {
  const task = await loadVisibleTask(accountId, taskId)
  if (!task.assignedTo || String(task.assignedTo._id || task.assignedTo) !== String(accountId)) {
    fail('Ban can nhan task truoc khi bao su co', 403)
  }
  const description = body.description?.trim()
  if (!description) fail('Mo ta su co khong duoc de trong')
  const severity = ['low', 'medium', 'high'].includes(body.severity) ? body.severity : 'medium'

  const exists = await RoomIssue.exists({
    housekeepingTask: task._id,
    description,
    status: 'open',
  })
  if (exists) fail('Su co nay da duoc bao cao va dang cho xu ly')

  const issue = await RoomIssue.create({
    branch: task.branch,
    room: task.room._id || task.room,
    reporter: accountId,
    description,
    severity,
    housekeepingTask: task._id,
  })

  task.issueNote = task.issueNote ? `${task.issueNote}\n- ${description}` : description
  await task.save()

  const room = await Room.findById(task.room._id || task.room)
  if (room && ['available', 'cleaning'].includes(room.status)) {
    room.status = 'maintenance'
    await room.save()
  }

  return issue
}

exports.markMaintenance = async (accountId, taskId, body = {}) => {
  const task = await loadVisibleTask(accountId, taskId)
  if (!task.assignedTo || String(task.assignedTo._id || task.assignedTo) !== String(accountId)) {
    fail('Ban can nhan task truoc khi chuyen phong bao tri', 403)
  }
  const room = await Room.findById(task.room._id || task.room)
  if (!room) fail('Phong khong ton tai', 404)
  if (room.status !== 'occupied') {
    room.status = 'maintenance'
    await room.save()
  }
  if (body.note) task.issueNote = task.issueNote ? `${task.issueNote}\n- ${body.note}` : body.note
  await task.save()
  return room
}

exports.completeTask = async (accountId, taskId) => {
  const task = await loadVisibleTask(accountId, taskId)
  if (!task.assignedTo || String(task.assignedTo._id || task.assignedTo) !== String(accountId)) {
    fail('Ban khong phai nguoi duoc gan task nay', 403)
  }
  if (DONE_TASK_STATUSES.includes(task.status)) fail('Task da ket thuc')
  // mid_stay (dọn theo yêu cầu): hoàn tất thẳng. inspection & turnover: phải đã nhập kiểm kê/hiện có.
  if (task.type !== 'mid_stay' && !task.amenityChecked) {
    fail('Can luu kiem ke / so hien co truoc khi hoan thanh')
  }

  task.status = 'completed'
  task.completedAt = new Date()
  await task.save()

  const room = await Room.findById(task.room._id || task.room)

  // Turnover: dọn xong + đối chiếu hiện có với chuẩn. Đủ -> available; thiếu -> chờ manager bổ sung.
  if (task.type === 'turnover') {
    const short = (task.amenityReport || []).some((r) => (r.missing || 0) > 0)
    if (room && room.status === 'cleaning') {
      if (short) {
        room.awaitingRestock = true
        await room.save()
        await safeNotify(() => notificationService.notifyManagers(task.branch, {
          type: 'general', title: `Phòng ${room.roomNumber} thiếu thiết bị, cần bổ sung`,
          body: 'Đã dọn xong nhưng chưa đủ đồ theo chuẩn — vui lòng restock để mở bán phòng',
          refType: 'room', refId: room._id,
        }))
      } else {
        room.status = 'available'
        room.awaitingRestock = false
        await room.save()
      }
    }
    return task
  }

  // inspection / mid_stay: khách còn ở (phòng 'occupied') -> guard cleaning tự bỏ qua.
  if (room && room.status === 'cleaning') {
    room.status = 'available'
    await room.save()
  }
  // Inspection xong -> báo lễ tân đã yêu cầu (bill đã cập nhật, có thể check-out)
  if (task.type === 'inspection' && task.requestedBy) {
    await safeNotify(() => notificationService.notifyUser(task.requestedBy, {
      type: 'inspection_done', title: `Đã kiểm tra xong phòng ${task.room.roomNumber || ''}`,
      body: 'Thiết bị thiếu (nếu có) đã được cộng vào bill — có thể check-out',
      refType: 'booking', refId: task.booking?._id || task.booking, branch: task.branch,
    }))
  }

  return task
}

exports.getHistory = async (accountId, query = {}) => {
  const branches = await myBranchIds(accountId)
  const filter = {
    branch: { $in: branches },
    assignedTo: accountId,
    status: { $in: DONE_TASK_STATUSES },
  }
  if (query.status) filter.status = query.status

  return populateTask(HousekeepingTask.find(filter))
    .sort({ completedAt: -1, updatedAt: -1 })
    .lean()
}

// Job gọi định kỳ: task chưa ai nhận -> 2p nhắc lại housekeeper; 5p báo manager + khoá tự nhận.
exports.runEscalation = async () => {
  const now = Date.now()
  let reminded = 0, escalated = 0

  // Tầng 2 (>5p): báo manager + set escalatedAt (chặn tự nhận)
  const toEscalate = await HousekeepingTask.find({
    assignedTo: null, status: { $in: ACTIVE_TASK_STATUSES }, escalatedAt: null,
    createdAt: { $lte: new Date(now - ESCALATE_AFTER_MS) },
  }).populate('room', 'roomNumber')
  for (const t of toEscalate) {
    t.escalatedAt = new Date()
    await t.save()
    await safeNotify(() => notificationService.notifyManagers(t.branch, {
      type: 'general', title: `Task phòng ${t.room?.roomNumber || ''} chưa ai nhận`,
      body: 'Quá 5 phút không housekeeper nào nhận — vui lòng phân công.',
      refType: 'task', refId: t._id,
    }))
    escalated++
  }

  // Tầng 1 (>2p, chưa escalate, chưa nhắc): nhắc lại tất cả housekeeper
  const toRemind = await HousekeepingTask.find({
    assignedTo: null, status: { $in: ACTIVE_TASK_STATUSES }, remindedAt: null, escalatedAt: null,
    createdAt: { $lte: new Date(now - REMIND_AFTER_MS) },
  }).populate('room', 'roomNumber')
  for (const t of toRemind) {
    t.remindedAt = new Date()
    await t.save()
    await safeNotify(() => notificationService.notifyHousekeepers(t.branch, {
      type: 'task_new', title: `Nhắc: phòng ${t.room?.roomNumber || ''} chưa ai nhận`,
      body: 'Việc vẫn đang chờ — nhận ngay trước khi chuyển quản lý.',
      refType: 'task', refId: t._id,
    }))
    reminded++
  }
  return { reminded, escalated }
}

// Dashboard đầu ca cho housekeeper: phòng trả hôm nay + việc chờ nhận + số liệu nhanh.
exports.getDashboard = async (accountId) => {
  const branches = await myBranchIds(accountId)
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86400000)

  const checkouts = await Booking.find({
    branch: { $in: branches }, room: { $ne: null },
    status: { $in: ['checked_in', 'checked_out'] },
    checkOut: { $gte: dayStart, $lt: dayEnd },
  }).populate('room', 'roomNumber floor').populate('roomType', 'name')
    .sort('checkOut').select('code guestName checkIn checkOut status room roomType').lean()

  const unclaimed = await populateTask(HousekeepingTask.find({
    branch: { $in: branches }, assignedTo: null, escalatedAt: null,
    status: { $in: ACTIVE_TASK_STATUSES },
  })).sort({ isUrgent: -1, createdAt: 1 }).lean()

  const [myActive, doneToday] = await Promise.all([
    HousekeepingTask.countDocuments({ branch: { $in: branches }, assignedTo: accountId, status: { $in: ['pending', 'in_progress', 'urgent'] } }),
    HousekeepingTask.countDocuments({ branch: { $in: branches }, assignedTo: accountId, status: 'completed', completedAt: { $gte: dayStart, $lt: dayEnd } }),
  ])

  return {
    counts: { checkoutsToday: checkouts.length, unclaimed: unclaimed.length, myActive, doneToday },
    checkouts,
    unclaimed,
    escalateAfterMs: ESCALATE_AFTER_MS, // FE tính cooldown
  }
}

/**
 * Called by bookingService.checkIn.
 * Check-in KHÔNG tạo task nữa (housekeeper biết phòng có khách qua room.status='occupied').
 * Chỉ dọn dữ liệu: đóng các task active còn sót của phòng này từ booking khác.
 */
exports.cleanupOnCheckIn = async (bookingId, roomId) => {
  if (!roomId) return
  await HousekeepingTask.updateMany(
    { room: roomId, booking: { $ne: bookingId }, status: { $in: ACTIVE_TASK_STATUSES } },
    { status: 'missed', completedAt: new Date() }
  )
}

// Lễ tân "Yêu cầu kiểm tra phòng" -> task inspection (claimable). 1 inspection mở/booking tại 1 thời điểm.
exports.createInspection = async (bookingId, roomId, requestedBy) => {
  const [booking, room] = await Promise.all([Booking.findById(bookingId), Room.findById(roomId)])
  if (!booking || !room) fail('Thieu booking/phong de tao task kiem tra', 404)
  const open = await HousekeepingTask.findOne({
    booking: bookingId, type: 'inspection', status: { $in: ACTIVE_TASK_STATUSES },
  })
  if (open) return open // đã có yêu cầu đang mở -> trả về, không tạo trùng
  const amenityReport = await buildAmenityReport(room._id, booking.roomType)
  const task = await HousekeepingTask.create({
    branch: booking.branch, room: room._id, booking: booking._id,
    type: 'inspection', status: 'pending', requestedBy, requestedAt: new Date(), amenityReport,
  })
  await safeNotify(() => notificationService.notifyHousekeepers(booking.branch, {
    type: 'task_new', title: `Yêu cầu kiểm tra phòng ${room.roomNumber}`,
    body: `Booking ${booking.code} — kiểm tra thiết bị trước khi khách trả`,
    refType: 'task', refId: task._id,
  }))
  return task
}

// Lễ tân "Dọn phòng" (khách yêu cầu giữa kỳ) -> task mid_stay. Miễn phí, được tạo nhiều lần.
exports.createMidStay = async (bookingId, roomId, requestedBy) => {
  const booking = await Booking.findById(bookingId)
  if (!booking || !roomId) fail('Thieu booking/phong de tao task don phong', 404)
  const task = await HousekeepingTask.create({
    branch: booking.branch, room: roomId, booking: bookingId,
    type: 'mid_stay', status: 'pending', requestedBy, requestedAt: new Date(),
  })
  const rn = await roomLabel(roomId)
  await safeNotify(() => notificationService.notifyHousekeepers(booking.branch, {
    type: 'task_new', title: `Yêu cầu dọn phòng ${rn}`,
    body: `Booking ${booking.code} — khách yêu cầu dọn phòng`,
    refType: 'task', refId: task._id,
  }))
  return task
}

// Tự động khi check-out -> task turnover (urgent) để dọn phòng cho khách kế tiếp.
exports.createTurnover = async (bookingId, roomId) => {
  if (!roomId) return null
  const booking = await Booking.findById(bookingId)
  if (!booking) return null
  const open = await HousekeepingTask.findOne({
    booking: bookingId, room: roomId, type: 'turnover', status: { $in: ACTIVE_TASK_STATUSES },
  })
  if (open) return open
  const amenityReport = await buildAmenityReport(roomId, booking.roomType)
  const task = await HousekeepingTask.create({
    branch: booking.branch, room: roomId, booking: bookingId,
    type: 'turnover', status: 'urgent', isUrgent: true, amenityReport,
  })
  const rn = await roomLabel(roomId)
  await safeNotify(() => notificationService.notifyHousekeepers(booking.branch, {
    type: 'task_new', title: `Dọn phòng ${rn} (khách đã trả)`,
    body: `Booking ${booking.code} đã check-out — cần dọn turnover`,
    refType: 'task', refId: task._id,
  }))
  return task
}

// Dữ liệu housekeeping của 1 booking cho màn lễ tân (trạng thái nút + lịch sử).
exports.bookingView = async (bookingId) => {
  const tasks = await HousekeepingTask.find({ booking: bookingId })
    .populate('assignedTo', 'email')
    .populate('requestedBy', 'email')
    .sort('-createdAt').lean()
  const inspections = tasks.filter((t) => t.type === 'inspection')
  const cleanings = tasks.filter((t) => t.type === 'mid_stay')
  const turnovers = tasks.filter((t) => t.type === 'turnover')
  return {
    activeInspection: inspections.find((t) => ACTIVE_TASK_STATUSES.includes(t.status)) || null,
    lastInspectionDone: inspections.find((t) => t.status === 'completed') || null,
    inspections, cleanings, turnovers,
  }
}
