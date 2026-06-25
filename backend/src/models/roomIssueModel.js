const mongoose = require('mongoose')

const roomIssueSchema = new mongoose.Schema({
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  room:        { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  reporter:    { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  description: { type: String, required: true, trim: true },
  // open: HK báo, chờ QL duyệt (phòng CHƯA đổi) -> maintaining: QL duyệt (phòng maintenance)
  // -> fix_requested: HK báo đã sửa, chờ QL xác nhận -> resolved: QL xác nhận (phòng available) | cancelled: QL từ chối
  status:      { type: String, enum: ['open', 'maintaining', 'fix_requested', 'resolved', 'cancelled'], default: 'open' },
  severity:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  housekeepingTask: { type: mongoose.Schema.Types.ObjectId, ref: 'HousekeepingTask', default: null },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // QL duyệt bảo trì
  approvedAt:  { type: Date },
  fixRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // HK báo đã sửa
  fixRequestedAt: { type: Date },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  resolvedAt:  { type: Date },
  resolutionNote: { type: String, trim: true },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  cancelledAt: { type: Date },
  cancellationReason: { type: String, trim: true },
}, { timestamps: true })

// Indexes for performance optimization
roomIssueSchema.index({ branch: 1, status: 1, createdAt: -1 })
roomIssueSchema.index({ room: 1, status: 1 })
roomIssueSchema.index({ housekeepingTask: 1, status: 1 })

// Prevent duplicate open issues at database-level to avoid race conditions
roomIssueSchema.index(
  { housekeepingTask: 1, description: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
)

module.exports = mongoose.model('RoomIssue', roomIssueSchema)
