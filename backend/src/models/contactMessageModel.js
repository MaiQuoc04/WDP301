// Owner: Quốc — tin nhắn liên hệ từ khách (trang Contact). Lễ tân + QL chi nhánh nhận & xử lý.
// Phản hồi thực hiện THỦ CÔNG qua email (mailto), hệ thống chỉ lưu + theo dõi trạng thái.
const mongoose = require('mongoose')

const CONTACT_STATUS = ['new', 'handled']

const contactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },
  phone:   { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  branch:  { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // null nếu khách vãng lai
  status:  { type: String, enum: CONTACT_STATUS, default: 'new' },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  handledAt: { type: Date },
}, { timestamps: true })

contactMessageSchema.index({ branch: 1, status: 1, createdAt: -1 })
contactMessageSchema.statics.CONTACT_STATUS = CONTACT_STATUS
module.exports = mongoose.model('ContactMessage', contactMessageSchema)
