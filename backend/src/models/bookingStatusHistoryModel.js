// Owner: Quốc — log mọi thay đổi Booking.status (BR-29). docs/STATUS_WORKFLOW_SPEC.md §3.
const mongoose = require('mongoose')

const bookingStatusHistorySchema = new mongoose.Schema({
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  fromStatus: { type: String },
  toStatus:   { type: String, required: true },
  changedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  note:       { type: String, trim: true },
}, { timestamps: true })

module.exports = mongoose.model('BookingStatusHistory', bookingStatusHistorySchema)
