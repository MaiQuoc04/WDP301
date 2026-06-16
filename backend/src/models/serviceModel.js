// Owner: Hoàng — branch service catalog (UC-66→68)
const mongoose = require('mongoose')

const serviceSchema = new mongoose.Schema({
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true },
  description: { type: String, trim: true },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

serviceSchema.index({ branch: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Service', serviceSchema)
