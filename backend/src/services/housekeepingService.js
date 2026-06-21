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

const ACTIVE_TASK_STATUSES = ['pending', 'in_progress', 'urgent']
const DONE_TASK_STATUSES = ['completed', 'missed']

function fail(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
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

async function buildAmenityReport(roomId, roomTypeId) {
  const roomAmenities = await RoomAmenity.find({ room: roomId })
    .populate('amenity', 'name missingPrice status')
    .lean()

  if (roomAmenities.length) {
    return roomAmenities
      .filter((ra) => ra.amenity && ra.amenity.status !== 'inactive')
      .map((ra) => ({
        amenity: ra.amenity._id,
        name: ra.amenity.name,
        expected: ra.quantity || 1,
        actual: ra.quantity || 1,
        missing: 0,
        condition: ra.condition || 'active',
      }))
  }

  const roomType = await RoomType.findById(roomTypeId).populate('amenities', 'name status').lean()
  return (roomType?.amenities || [])
    .filter((amenity) => amenity && amenity.status !== 'inactive')
    .map((amenity) => ({
      amenity: amenity._id,
      name: amenity.name,
      expected: 1,
      actual: 1,
      missing: 0,
      condition: 'active',
    }))
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

exports.claimTask = async (accountId, taskId) => {
  const task = await loadVisibleTask(accountId, taskId)
  if (DONE_TASK_STATUSES.includes(task.status)) fail('Khong the nhan task da ket thuc')
  if (task.assignedTo && String(task.assignedTo._id || task.assignedTo) !== String(accountId)) {
    fail('Task da duoc nhan boi nhan vien khac')
  }
  if (!task.assignedTo) {
    task.assignedTo = accountId
    task.assignedAt = new Date()
  }
  return task.save()
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
  if (!task.amenityChecked) fail('Can luu bao cao kiem tra thiet bi truoc khi hoan thanh')

  task.status = 'completed'
  task.completedAt = new Date()
  await task.save()

  const room = await Room.findById(task.room._id || task.room)
  if (room && room.status === 'cleaning') {
    room.status = 'available'
    await room.save()
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

/**
 * Called by bookingService.checkIn.
 * Mark unfinished older tasks for this room as missed, then create the inspection task
 * for the new in-house booking if it does not exist yet.
 */
exports.createOnCheckIn = async (bookingId, roomId) => {
  const [booking, room] = await Promise.all([
    Booking.findById(bookingId),
    Room.findById(roomId),
  ])
  if (!booking || !room) fail('Khong the tao task housekeeping do thieu booking/phong', 404)

  await HousekeepingTask.updateMany(
    {
      room: room._id,
      booking: { $ne: booking._id },
      status: { $in: ACTIVE_TASK_STATUSES },
    },
    { status: 'missed', completedAt: new Date() }
  )

  const existing = await HousekeepingTask.findOne({ booking: booking._id, room: room._id })
  if (existing) return existing

  const amenityReport = await buildAmenityReport(room._id, booking.roomType)
  return HousekeepingTask.create({
    branch: booking.branch,
    room: room._id,
    booking: booking._id,
    status: 'pending',
    amenityReport,
  })
}

/**
 * Called by bookingService.checkOut.
 * If the task tied to this stay is not completed yet, it becomes urgent for cleanup.
 */
exports.markUrgentOnCheckOut = async (bookingId, roomId) => {
  if (!roomId) return null
  const task = await HousekeepingTask.findOne({
    booking: bookingId,
    room: roomId,
    status: { $in: ACTIVE_TASK_STATUSES },
  })
  if (!task) return null
  if (task.status !== 'completed') {
    task.status = 'urgent'
    task.isUrgent = true
    await task.save()
  }
  return task
}
