// Owner: Hoàng — standard amenity list + price charged when missing (UC-63→65)
const mongoose = require('mongoose')

const amenitySchema = new mongoose.Schema({
  branch:       { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name:         { type: String, required: true, trim: true },
  missingPrice: { type: Number, default: 0 }, // tiền phạt khi thiếu/hỏng
  unit:         { type: String, default: 'cái' },
  status:       { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('Amenity', amenitySchema)
