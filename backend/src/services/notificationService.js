// Owner: Quốc — tạo + đọc thông báo. Fan-out 1 doc/người nhận + bắn realtime qua socket.
const Notification = require('../models/notificationModel')
const RoleAssignment = require('../models/roleAssignmentModel')
const { emitToUser } = require('../config/socket')

// Tạo thông báo cho nhiều người (mỗi người 1 doc) + đẩy realtime.
exports.notifyUsers = async (recipientIds, payload = {}) => {
  const uniq = [...new Set((recipientIds || []).map(String))].filter(Boolean)
  if (!uniq.length) return []
  const { type = 'general', title, body = '', refType, refId, branch } = payload
  const docs = await Notification.insertMany(
    uniq.map((r) => ({ recipient: r, type, title, body, refType, refId, branch }))
  )
  for (const d of docs) {
    try { emitToUser(String(d.recipient), 'notification', d.toObject()) } catch { /* offline */ }
  }
  return docs
}

exports.notifyUser = async (recipientId, payload = {}) => {
  if (!recipientId) return null
  const [doc] = await exports.notifyUsers([recipientId], payload)
  return doc || null
}

// Tất cả housekeeper đang active của 1 chi nhánh.
exports.housekeeperIds = async (branch) => {
  const ras = await RoleAssignment.find({ branch, role: 'housekeeper', isActive: true }).select('account -_id').lean()
  return ras.map((r) => r.account)
}

exports.notifyHousekeepers = async (branch, payload = {}) => {
  const ids = await exports.housekeeperIds(branch)
  return exports.notifyUsers(ids, { ...payload, branch })
}

// Tất cả receptionist đang active của 1 chi nhánh.
exports.receptionistIds = async (branch) => {
  const ras = await RoleAssignment.find({ branch, role: 'receptionist', isActive: true }).select('account -_id').lean()
  return ras.map((r) => r.account)
}

exports.notifyReceptionists = async (branch, payload = {}) => {
  const ids = await exports.receptionistIds(branch)
  return exports.notifyUsers(ids, { ...payload, branch })
}

// Tất cả branch_manager đang active của 1 chi nhánh.
exports.managerIds = async (branch) => {
  const ras = await RoleAssignment.find({ branch, role: 'branch_manager', isActive: true }).select('account -_id').lean()
  return ras.map((r) => r.account)
}

exports.notifyManagers = async (branch, payload = {}) => {
  const ids = await exports.managerIds(branch)
  return exports.notifyUsers(ids, { ...payload, branch })
}

// ----- đọc / đánh dấu -----
exports.list = async (accountId, { unreadOnly, limit = 50 } = {}) => {
  const q = { recipient: accountId }
  if (unreadOnly === true || unreadOnly === 'true') q.isRead = false
  return Notification.find(q).sort('-createdAt').limit(Number(limit) || 50).lean()
}

exports.unreadCount = async (accountId) =>
  Notification.countDocuments({ recipient: accountId, isRead: false })

exports.markRead = async (accountId, id) => {
  const n = await Notification.findOneAndUpdate(
    { _id: id, recipient: accountId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  )
  if (!n) { const e = new Error('Không tìm thấy thông báo'); e.status = 404; throw e }
  return n
}

exports.markAllRead = async (accountId) => {
  const r = await Notification.updateMany(
    { recipient: accountId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )
  return { modified: r.modifiedCount ?? r.nModified ?? 0 }
}
