// Ảnh thư viện / ẩm thực do super_admin quản lý — GLOBAL, không gắn chi nhánh (Phase 2 FE redesign)
const mongoose = require('mongoose')

const galleryImageSchema = new mongoose.Schema({
  imageUrl:  { type: String, required: true },              // path tương đối, vd /uploads/123-anh.jpg
  caption:   { type: String, trim: true, default: '' },
  category:  { type: String, enum: ['gallery', 'dining'], default: 'gallery', index: true },
  sortOrder: { type: Number, default: 0 },
  status:    { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('GalleryImage', galleryImageSchema)
