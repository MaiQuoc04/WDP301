// Owner: Quốc — tin nhắn liên hệ: tạo (khách gửi), liệt kê + đánh dấu đã xử lý (lễ tân/QL).
const ContactMessage = require('../models/contactMessageModel')
const Branch = require('../models/branchModel')
const notificationService = require('./notificationService')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Khách gửi tin nhắn -> lưu + báo lễ tân & QL của chi nhánh đã chọn.
exports.create = async ({ name, email, phone, subject, message, branchId, customerId } = {}) => {
  if (!name || !name.trim()) throw new Error('Vui lòng nhập họ tên')
  if (!email || !EMAIL_RE.test(email.trim())) throw new Error('Email không hợp lệ')
  if (!subject || !subject.trim()) throw new Error('Vui lòng nhập tiêu đề')
  if (!message || !message.trim()) throw new Error('Vui lòng nhập nội dung')
  if (!branchId) throw new Error('Vui lòng chọn chi nhánh')
  const branch = await Branch.findById(branchId)
  if (!branch || !branch.isActive) throw new Error('Chi nhánh không hợp lệ')

  const doc = await ContactMessage.create({
    name: name.trim(), email: email.trim(), phone: phone?.trim(),
    subject: subject.trim(), message: message.trim(),
    branch: branch._id, customer: customerId || undefined,
  })

  // Báo lễ tân + QL chi nhánh (in-app + realtime). Defensive: lỗi thông báo không chặn việc gửi.
  try {
    const payload = { type: 'general', title: `Tin nhắn liên hệ mới: ${doc.subject}`, body: `${doc.name} · ${doc.email}`, refType: 'contact', refId: doc._id }
    await Promise.all([
      notificationService.notifyReceptionists(branch._id, payload),
      notificationService.notifyManagers(branch._id, payload),
    ])
  } catch (e) { console.warn('[contact] notify lỗi:', e.message) }

  return doc
}

// Danh sách tin nhắn của các chi nhánh được scope (lễ tân: nhiều; QL: 1). Lọc status tuỳ chọn.
exports.listForBranches = async (branchIds, { status } = {}) => {
  const q = { branch: { $in: branchIds } }
  if (status) q.status = status
  return ContactMessage.find(q)
    .populate('branch', 'name')
    .populate('handledBy', 'email')
    .sort('-createdAt').lean()
}

// Đánh dấu đã xử lý — chỉ khi tin thuộc chi nhánh của người thao tác.
exports.markHandled = async (id, branchIds, by) => {
  const msg = await ContactMessage.findOne({ _id: id, branch: { $in: branchIds } })
  if (!msg) { const e = new Error('Không tìm thấy tin nhắn trong chi nhánh của bạn'); e.status = 404; throw e }
  if (msg.status !== 'handled') {
    msg.status = 'handled'; msg.handledBy = by; msg.handledAt = new Date()
    await msg.save()
  }
  return msg
}
