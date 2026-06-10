// Owner: Khánh — customer reviews & ratings, with staff replies (UC-22→25)
const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  booking:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  branch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  roomType:  { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
  rating:    { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, trim: true },
  reactions: [{
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    type:    { type: String, enum: ['like', 'helpful'], default: 'like' },
  }],
  staffReply: {
    text:      { type: String },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    repliedAt: { type: Date },
  },
  status: { type: String, enum: ['active', 'hidden'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('Review', reviewSchema)
