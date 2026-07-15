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

// ─── Hạn BẮT ĐẦU dọn phòng ───────────────────────────────────────────────────
// HK phải bấm Bắt đầu trong 20' kể từ khi task TỚI LƯỢT; quá hạn -> báo HK + quản lý chi nhánh.
const CLEAN_START_SLA_MIN = 20
// "Dọn phòng" = turnover (dọn sau trả phòng) + mid_stay (khách yêu cầu dọn).
// inspection là kiểm kê thiết bị, không phải dọn -> không tính hạn.
const CLEAN_TASK_TYPES = ['turnover', 'mid_stay']
// Chưa bắt đầu = pending HOẶC urgent. Không được lọc mỗi 'pending':
// createTurnover tạo task với status 'urgent' -> lọc 'pending' là không bao giờ khớp.
const NOT_STARTED_STATUSES = ['pending', 'urgent']

// Realtime: báo booking vừa đổi (bill/thiết bị thiếu) để màn lễ tân tự cập nhật, không reload tay. Defensive.
function emitBookingUpdated(bookingRef) {
  const bookingId = bookingRef && (bookingRef._id || bookingRef)
  if (!bookingId) return
  try { require('../config/socket').emitBookingUpdated(bookingId) }
  catch (e) { console.warn('[hk] emitBookingUpdated lỗi:', e.message) }
}

function fail(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

// Xác thực 1 account là housekeeper active thuộc chi nhánh (dùng khi lễ tân giao việc).
async function assertHousekeeperInBranch(accountId, branch) {
  if (!accountId) fail('Phải chọn nhân viên buồng phòng để giao việc')
  const ra = await RoleAssignment.findOne({ account: accountId, branch, role: 'housekeeper', isActive: true })
  if (!ra) fail('Nhân viên buồng phòng không hợp lệ hoặc không thuộc chi nhánh')
  return accountId
}
exports.assertHousekeeperInBranch = assertHousekeeperInBranch

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

exports.startTask = async (accountId, taskId) => {
  const task = await loadVisibleTask(accountId, taskId)
  // Tự gán nếu task chưa có ai nhận (task cũ hoặc chưa chỉ định)
  if (!task.assignedTo) {
    task.assignedTo = accountId
    task.assignedAt = new Date()
  } else if (String(task.assignedTo._id || task.assignedTo) !== String(accountId)) {
    fail('Ban khong phai nguoi duoc gan task nay', 403)
  }
  if (!['pending', 'urgent'].includes(task.status)) fail('Chi task pending/urgent moi co the bat dau')
  // FIFO: phải hoàn thành task được GIAO TRƯỚC (assignedAt nhỏ hơn, còn dở) rồi mới bắt đầu task này
  const earlier = await HousekeepingTask.findOne({
    assignedTo: accountId, status: { $in: ACTIVE_TASK_STATUSES }, _id: { $ne: task._id },
    assignedAt: { $lt: task.assignedAt },
  }).populate('room', 'roomNumber').sort('assignedAt')
  if (earlier) fail(`Phải hoàn thành task được giao trước (phòng ${earlier.room?.roomNumber || '?'}) rồi mới bắt đầu task này`)
  task.status = 'in_progress'
  task.startedAt = task.startedAt || new Date()
  return task.save()
}

exports.saveAmenityReport = async (accountId, taskId, report = []) => {
  const task = await loadVisibleTask(accountId, taskId)
  if (task.type === 'mid_stay') fail('Task don phong giua ky khong can kiem ke thiet bi')
  if (DONE_TASK_STATUSES.includes(task.status)) fail('Khong the sua bao cao cua task da ket thuc')
  // Tự gán nếu chưa có ai nhận
  if (!task.assignedTo) {
    task.assignedTo = accountId
    task.assignedAt = new Date()
  } else if (String(task.assignedTo._id || task.assignedTo) !== String(accountId)) {
    fail('Task nay da duoc giao cho nguoi khac', 403)
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

  // Đồng bộ (reconcile) phí thiết bị thiếu vào bill theo báo cáo MỚI NHẤT:
  // thiếu -> thêm/cập nhật dòng; kiểm lại ĐỦ (missing=0) mà trước đã tính -> GỠ khỏi bill.
  if (task.booking) {
    const booking = await Booking.findById(task.booking._id || task.booking)
    if (booking && ['confirmed', 'checked_in'].includes(booking.status)) {
      for (const row of task.amenityReport) {
        const line = booking.missingAmenities.find((l) => String(l.amenity) === String(row.amenity))
        if (row.missing > 0) {
          const amenity = await Amenity.findById(row.amenity)
          const price = amenity ? amenity.missingPrice : (line ? line.price : 0)
          if (line) { line.quantity = row.missing; line.price = price }
          else booking.missingAmenities.push({ amenity: row.amenity, name: row.name || (amenity && amenity.name) || '', price, quantity: row.missing })
          row.chargedAt = row.chargedAt || new Date()
        } else if (line && row.chargedAt) {
          booking.missingAmenities.pull(line._id)   // đã tính trước đó, giờ đủ -> gỡ
          row.chargedAt = undefined
        }
      }
      bookingService.recomputeExtras(booking)
      bookingService.recalcBill(booking)
      await booking.save()
    }
  }

  await task.save()
  // Realtime: lễ tân đang xem/checkout phòng này thấy thiết bị thiếu + bill cập nhật ngay, không reload tay.
  emitBookingUpdated(task.booking)
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

  // KHÔNG tự set phòng maintenance — chỉ tạo yêu cầu 'open' chờ quản lý duyệt, rồi báo manager.
  const roomId = task.room._id || task.room
  const issue = await RoomIssue.create({
    branch: task.branch, room: roomId, reporter: accountId,
    description, severity, housekeepingTask: task._id, status: 'open',
  })
  task.issueNote = task.issueNote ? `${task.issueNote}\n- ${description}` : description
  await task.save()

  const rn = await roomLabel(roomId)
  await safeNotify(() => notificationService.notifyManagers(task.branch, {
    type: 'general', title: `Phòng ${rn} cần bảo trì — chờ duyệt`,
    body: description, refType: 'room', refId: roomId,
  }))
  return issue
}

// HK báo "đã sửa xong" cho 1 phòng đang bảo trì -> chuyển fix_requested + báo quản lý xác nhận.
exports.requestFix = async (accountId, issueId, body = {}) => {
  const branches = await myBranchIds(accountId)
  const issue = await RoomIssue.findOne({ _id: issueId, branch: { $in: branches } })
  if (!issue) fail('Không tìm thấy yêu cầu bảo trì trong chi nhánh của bạn', 404)
  if (issue.status !== 'maintaining') fail('Chỉ báo đã sửa cho phòng đang bảo trì')
  issue.status = 'fix_requested'
  issue.fixRequestedBy = accountId
  issue.fixRequestedAt = new Date()
  if (body.note) issue.resolutionNote = body.note
  await issue.save()
  const rn = await roomLabel(issue.room)
  await safeNotify(() => notificationService.notifyManagers(issue.branch, {
    type: 'general', title: `Phòng ${rn} đã sửa xong — chờ xác nhận`,
    body: 'Housekeeper báo đã sửa xong, vui lòng kiểm tra & xác nhận mở lại phòng.',
    refType: 'room', refId: issue.room,
  }))
  return issue
}

// Danh sách phòng đang bảo trì / chờ xác nhận sửa (cho trang "Phòng đang bảo trì" của HK).
exports.listMaintenance = async (accountId) => {
  const branches = await myBranchIds(accountId)
  return RoomIssue.find({ branch: { $in: branches }, status: { $in: ['maintaining', 'fix_requested'] } })
    .populate('room', 'roomNumber floor status')
    .sort('-approvedAt -createdAt').lean()
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
  // Realtime cho MỌI lễ tân đang mở booking này (không chỉ người yêu cầu) -> tự cập nhật trạng thái kiểm tra + bill.
  emitBookingUpdated(task.booking)

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

// Gợi ý housekeeper để lễ tân giao việc: ưu tiên đúng tầng + đang rảnh; không ai đúng tầng -> tầng kề.
// Ai đang dọn các phòng này, bắt đầu từ lúc nào. Dùng cho lễ tân: phòng chưa 'available' thì phải biết
// ai đang dọn để gọi giục, thay vì bấm check-in rồi mới ăn lỗi "phòng đang cleaning".
// LƯU Ý: task chặn check-in thuộc booking của khách TRƯỚC (turnover sau khi họ trả phòng),
// không phải booking sắp nhận -> không thể lấy qua getBookingHousekeeping(bookingId) được.
// Chỉ gọi từ tầng lễ tân — KHÔNG nhét vào searchAvailableRooms vì hàm đó dùng chung với API công khai (lộ tên nhân viên).
exports.roomCleaningInfo = async (roomIds = []) => {
  const ids = (roomIds || []).filter(Boolean)
  if (!ids.length) return {}
  const tasks = await HousekeepingTask.find({
    room: { $in: ids }, status: { $in: ACTIVE_TASK_STATUSES },
  }).populate('assignedTo', 'fullName email').sort('-assignedAt').lean()

  const map = {}
  for (const t of tasks) {
    const k = String(t.room)
    if (map[k]) continue // đã lấy task mới nhất của phòng này
    map[k] = {
      taskId: t._id,
      type: t.type,
      status: t.status,
      isUrgent: !!t.isUrgent,
      assignedAt: t.assignedAt,
      startedAt: t.startedAt,
      // null = đã tạo task nhưng CHƯA ai nhận -> lễ tân biết mà giao người
      housekeeper: t.assignedTo ? (t.assignedTo.fullName || t.assignedTo.email) : null,
      housekeeperId: t.assignedTo?._id || null,
    }
  }
  return map
}

exports.suggestHousekeepers = async (branchId, roomFloor) => {
  const ras = await RoleAssignment.find({ branch: branchId, role: 'housekeeper', isActive: true })
    .populate('account', '_id email fullName isActive').lean()
  const out = []
  for (const ra of ras) {
    if (!ra.account || ra.account.isActive === false) continue
    const floors = ra.floors || []
    const activeTasks = await HousekeepingTask.countDocuments({ assignedTo: ra.account._id, status: { $in: ACTIVE_TASK_STATUSES } })
    let distance = 999 // chưa phân tầng -> xếp cuối
    if (floors.length && roomFloor != null) {
      distance = floors.includes(roomFloor) ? 0 : Math.min(...floors.map((f) => Math.abs(f - roomFloor)))
    } else if (floors.length) {
      distance = 0 // không biết tầng phòng -> coi như ngang nhau
    }
    out.push({
      accountId: ra.account._id, email: ra.account.email, fullName: ra.account.fullName || '',
      floors, activeTasks, busy: activeTasks > 0, onFloor: distance === 0, distance,
    })
  }
  // Ưu tiên: gần tầng nhất -> đang rảnh -> theo tên
  out.sort((a, b) => a.distance - b.distance || a.activeTasks - b.activeTasks || String(a.fullName || a.email).localeCompare(String(b.fullName || b.email), 'vi'))
  return out
}

// Dashboard đầu ca cho housekeeper: phòng trả hôm nay + VIỆC CỦA TÔI (theo thứ tự được giao).
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

  // Việc của tôi (đang mở), xếp theo thứ tự được giao -> cái đầu là việc PHẢI LÀM TRƯỚC (FIFO)
  const myTasks = await populateTask(HousekeepingTask.find({
    branch: { $in: branches }, assignedTo: accountId, status: { $in: ACTIVE_TASK_STATUSES },
  })).sort('assignedAt').lean()

  const doneToday = await HousekeepingTask.countDocuments({
    branch: { $in: branches }, assignedTo: accountId, status: 'completed', completedAt: { $gte: dayStart, $lt: dayEnd },
  })

  return {
    counts: { checkoutsToday: checkouts.length, myActive: myTasks.length, doneToday },
    checkouts,
    myTasks,
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

// Lễ tân "Yêu cầu kiểm tra phòng" -> task inspection, GIAO trực tiếp cho housekeeper. 1 inspection mở/booking.
exports.createInspection = async (bookingId, roomId, requestedBy, assignedTo) => {
  const [booking, room] = await Promise.all([Booking.findById(bookingId), Room.findById(roomId)])
  if (!booking || !room) fail('Thieu booking/phong de tao task kiem tra', 404)
  const open = await HousekeepingTask.findOne({
    booking: bookingId, type: 'inspection', status: { $in: ACTIVE_TASK_STATUSES },
  })
  if (open) return open // đã có yêu cầu đang mở -> trả về, không tạo trùng
  const assignee = await assertHousekeeperInBranch(assignedTo, booking.branch)
  const amenityReport = await buildAmenityReport(room._id, booking.roomType)
  const now = new Date()
  const task = await HousekeepingTask.create({
    branch: booking.branch, room: room._id, booking: booking._id,
    type: 'inspection', status: 'pending', requestedBy, requestedAt: now,
    assignedTo: assignee, assignedAt: now, assignedBy: requestedBy, amenityReport,
  })
  await safeNotify(() => notificationService.notifyUser(assignee, {
    type: 'task_new', title: `Bạn được giao kiểm tra phòng ${room.roomNumber}`,
    body: `Booking ${booking.code} — kiểm tra thiết bị trước khi khách trả`,
    refType: 'task', refId: task._id, branch: booking.branch,
  }))
  return task
}

// Lễ tân "Dọn phòng" (khách yêu cầu giữa kỳ) -> task mid_stay. Miễn phí, được tạo nhiều lần.
exports.createMidStay = async (bookingId, roomId, requestedBy, assignedTo) => {
  const booking = await Booking.findById(bookingId)
  if (!booking || !roomId) fail('Thieu booking/phong de tao task don phong', 404)
  const assignee = await assertHousekeeperInBranch(assignedTo, booking.branch)
  const now = new Date()
  const task = await HousekeepingTask.create({
    branch: booking.branch, room: roomId, booking: bookingId,
    type: 'mid_stay', status: 'pending', requestedBy, requestedAt: now,
    assignedTo: assignee, assignedAt: now, assignedBy: requestedBy,
  })
  const rn = await roomLabel(roomId)
  await safeNotify(() => notificationService.notifyUser(assignee, {
    type: 'task_new', title: `Bạn được giao dọn phòng ${rn}`,
    body: `Booking ${booking.code} — khách yêu cầu dọn phòng`,
    refType: 'task', refId: task._id, branch: booking.branch,
  }))
  return task
}

// Tự động khi check-out -> task turnover (urgent). Lễ tân giao cho housekeeper lúc check-out.
exports.createTurnover = async (bookingId, roomId, assignedTo) => {
  if (!roomId) return null
  const booking = await Booking.findById(bookingId)
  if (!booking) return null
  const open = await HousekeepingTask.findOne({
    booking: bookingId, room: roomId, type: 'turnover', status: { $in: ACTIVE_TASK_STATUSES },
  })
  if (open) return open
  const assignee = await assertHousekeeperInBranch(assignedTo, booking.branch)
  const amenityReport = await buildAmenityReport(roomId, booking.roomType)
  const now = new Date()
  const task = await HousekeepingTask.create({
    branch: booking.branch, room: roomId, booking: bookingId,
    type: 'turnover', status: 'urgent', isUrgent: true, amenityReport,
    assignedTo: assignee, assignedAt: now, assignedBy: booking.createdBy || null,
  })
  const rn = await roomLabel(roomId)
  await safeNotify(() => notificationService.notifyUser(assignee, {
    type: 'task_new', title: `Bạn được giao dọn phòng ${rn} (khách đã trả)`,
    body: `Booking ${booking.code} đã check-out — cần dọn turnover`,
    refType: 'task', refId: task._id, branch: booking.branch,
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

// ─── Quá hạn bắt đầu dọn ─────────────────────────────────────────────────────
// Task tới lượt lúc nào? = mốc MUỘN HƠN giữa "được giao" và "task giao trước đó vừa xong".
//
// Vì sao KHÔNG đếm từ startedAt: không bấm Bắt đầu là không bao giờ trễ -> chỉ bắt được
// người dọn chậm, không bắt được người lười (đúng loại cần bắt nhất).
//
// Vì sao KHÔNG đếm thẳng từ assignedAt: startTask có luật FIFO cấm bắt đầu task sau khi
// task trước còn dở. Trả nhóm 5 phòng tạo 5 task trong 1 vòng lặp -> assignedAt gần như
// bằng nhau; đếm từ đó thì 4 task báo trễ trong lúc hệ thống đang CẤM HK động vào chúng.
// Đếm từ "tới lượt" vẫn không lách được: xong phòng trước là đồng hồ phòng sau chạy ngay,
// chẳng dính gì tới nút Bắt đầu.
const dueFromOf = async (task) => {
  // Cùng câu truy vấn FIFO mà startTask dùng -> "được phép bắt đầu" ở đây khớp với thực tế.
  const blocking = await HousekeepingTask.findOne({
    assignedTo: task.assignedTo, status: { $in: ACTIVE_TASK_STATUSES },
    _id: { $ne: task._id }, assignedAt: { $lt: task.assignedAt },
  }).select('_id').lean()
  if (blocking) return null // chưa tới lượt -> đồng hồ chưa chạy

  const prevDone = await HousekeepingTask.findOne({
    assignedTo: task.assignedTo, _id: { $ne: task._id },
    assignedAt: { $lt: task.assignedAt }, completedAt: { $ne: null },
  }).sort('-completedAt').select('completedAt').lean()

  const assigned = new Date(task.assignedAt).getTime()
  const freedAt = prevDone ? new Date(prevDone.completedAt).getTime() : 0
  return new Date(Math.max(assigned, freedAt))
}

// Quét task dọn quá hạn bắt đầu -> báo HK phụ trách + quản lý chi nhánh. Trả về số task đã báo.
exports.notifyOverdueCleaning = async () => {
  const tasks = await HousekeepingTask.find({
    type: { $in: CLEAN_TASK_TYPES },
    status: { $in: NOT_STARTED_STATUSES },
    assignedTo: { $exists: true, $ne: null },
    overdueNotifiedAt: null,     // khớp cả doc cũ chưa có field -> không bắn lại
    assignedAt: { $ne: null },
  }).populate('room', 'roomNumber').lean()

  const now = Date.now()
  let sent = 0
  for (const t of tasks) {
    const dueFrom = await dueFromOf(t)
    if (!dueFrom) continue
    const lateMin = Math.floor((now - dueFrom.getTime()) / 60000)
    if (lateMin < CLEAN_START_SLA_MIN) continue

    const rn = t.room?.roomNumber || '?'
    await safeNotify(() => notificationService.notifyUser(t.assignedTo, {
      type: 'task_overdue', title: `Quá hạn: phòng ${rn} chưa bắt đầu dọn`,
      body: `Đã ${lateMin} phút kể từ khi việc tới lượt bạn (hạn ${CLEAN_START_SLA_MIN} phút). Vào bấm Bắt đầu để dọn.`,
      refType: 'task', refId: t._id, branch: t.branch,
    }))
    await safeNotify(() => notificationService.notifyManagers(t.branch, {
      type: 'task_overdue', title: `Phòng ${rn} quá hạn dọn ${lateMin} phút`,
      body: `Việc đã tới lượt nhân viên buồng phòng nhưng chưa được bắt đầu (hạn ${CLEAN_START_SLA_MIN} phút).`,
      refType: 'task', refId: t._id, branch: t.branch,
    }))
    await HousekeepingTask.updateOne({ _id: t._id }, { overdueNotifiedAt: new Date() })
    sent++
  }
  return sent
}
