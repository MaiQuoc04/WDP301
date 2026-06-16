// Owner: Hoàng — room category detail (UC-57→59)
const mongoose = require('mongoose')

const roomTypeSchema = new mongoose.Schema({
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name:        { type: String, required: true, trim: true },
  bedType:     { type: String, enum: ['single', 'double', 'twin', 'king'] },
  capacity:    { type: Number, default: 2 },
  area:        { type: Number }, // m2
  basePrice:   { type: Number, required: true },
  description: { type: String, trim: true },
  images:      [{ type: String }],
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  amenities:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
}, { timestamps: true })

roomTypeSchema.index({ branch: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('RoomType', roomTypeSchema)
