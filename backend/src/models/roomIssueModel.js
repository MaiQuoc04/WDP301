const mongoose = require('mongoose')

const roomIssueSchema = new mongoose.Schema({
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  room:        { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  reporter:    { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  description: { type: String, required: true, trim: true },
  status:      { type: String, enum: ['open', 'resolved'], default: 'open' },
  severity:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  resolvedAt:  { type: Date },
  resolutionNote: { type: String, trim: true },
}, { timestamps: true })

// Indexes for performance optimization
roomIssueSchema.index({ branch: 1, status: 1, createdAt: -1 })
roomIssueSchema.index({ room: 1, status: 1 })

module.exports = mongoose.model('RoomIssue', roomIssueSchema)
