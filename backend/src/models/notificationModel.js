// Owner: Quốc — thông báo trong app (dùng chung lễ tân/housekeeper). Fan-out: 1 doc / người nhận.
const mongoose = require('mongoose')

// type: gợi ý nguồn sự kiện để FE chọn icon/màu. refType+refId để deep-link khi bấm.
const NOTI_TYPE = ['task_new', 'task_claimed', 'task_overdue', 'inspection_done', 'general']

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  branch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  type:      { type: String, enum: NOTI_TYPE, default: 'general' },
  title:     { type: String, required: true },
  body:      { type: String, default: '' },
  refType:   { type: String }, // 'task' | 'booking'
  refId:     { type: mongoose.Schema.Types.ObjectId },
  isRead:    { type: Boolean, default: false },
  readAt:    { type: Date },
}, { timestamps: true })

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.statics.NOTI_TYPE = NOTI_TYPE
module.exports = mongoose.model('Notification', notificationSchema)
