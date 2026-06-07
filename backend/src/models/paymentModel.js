// Owner: Quốc — payment records of a booking (UC-18/21/31)
const mongoose = require('mongoose')

const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded']

const paymentSchema = new mongoose.Schema({
  booking:       { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  type:          { type: String, enum: ['deposit', 'remaining', 'refund'], required: true },
  method:        { type: String, enum: ['payos', 'vietqr', 'cash'], default: 'payos' },
  amount:        { type: Number, required: true },
  status:        { type: String, enum: PAYMENT_STATUS, default: 'pending' },
  transactionId: { type: String },
  paidAt:        { type: Date },
}, { timestamps: true })

paymentSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS
module.exports = mongoose.model('Payment', paymentSchema)
