// Owner: Hoàng — room category detail (UC-57→59)
const mongoose = require('mongoose')

const roomTypeSchema = new mongoose.Schema({
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name:        { type: String, required: true, trim: true },
  bedType:     { type: String, enum: ['single', 'double', 'twin', 'king'] },
  capacity:    { type: Number, default: 2 },
  totalBeds:     { type: Number, default: 1 }, // sức chứa = totalBeds × 2 đơn vị (người lớn=1, trẻ em=0.5)
  extraChildFee: { type: Number, default: 0 }, // phụ phí mỗi trẻ vượt sức chứa, tính /đêm
  area:        { type: Number }, // m2
  basePrice:   { type: Number, required: true },
  description: { type: String, trim: true },
  images:      [{ type: String }],
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('RoomType', roomTypeSchema)
