// Quản lý ảnh thư viện / ẩm thực (super_admin) + API public cho FE. GLOBAL, không theo chi nhánh.
const fs = require('fs')
const path = require('path')
const GalleryImage = require('../models/galleryImageModel')

// Trả URL tuyệt đối để FE (khác port) load được ảnh
const absUrl = (req, p) => (!p || p.startsWith('http') ? p : `${req.protocol}://${req.get('host')}${p}`)
const mapImg = (req) => (i) => ({ ...i, imageUrl: absUrl(req, i.imageUrl) })

// --- Admin: upload 1 ảnh (multipart, field 'image') ---
exports.createImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp ảnh' })
    const { caption = '', category = 'gallery', sortOrder = 0 } = req.body
    if (!['gallery', 'dining'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Danh mục không hợp lệ' })
    }
    const img = await GalleryImage.create({
      imageUrl: `/uploads/${req.file.filename}`,
      caption,
      category,
      sortOrder: Number(sortOrder) || 0,
    })
    res.status(201).json({ success: true, data: mapImg(req)(img.toObject()) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Admin: danh sách (mọi trạng thái) ---
exports.listImages = async (req, res) => {
  try {
    const { category } = req.query
    const filter = category ? { category } : {}
    const imgs = await GalleryImage.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean()
    res.json({ success: true, data: imgs.map(mapImg(req)) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Admin: bật/tắt hiển thị ---
exports.updateImage = async (req, res) => {
  try {
    const { caption, category, sortOrder, status } = req.body
    const update = {}
    if (caption != null) update.caption = caption
    if (category != null && ['gallery', 'dining'].includes(category)) update.category = category
    if (sortOrder != null) update.sortOrder = Number(sortOrder) || 0
    if (status != null && ['active', 'inactive'].includes(status)) update.status = status
    const img = await GalleryImage.findByIdAndUpdate(req.params.id, update, { new: true }).lean()
    if (!img) return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' })
    res.json({ success: true, data: mapImg(req)(img) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Admin: xoá (xoá cả file vật lý) ---
exports.deleteImage = async (req, res) => {
  try {
    const img = await GalleryImage.findByIdAndDelete(req.params.id)
    if (!img) return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' })
    try {
      fs.unlinkSync(path.join('uploads', path.basename(img.imageUrl)))
    } catch (_) { /* file có thể đã bị xoá — bỏ qua */ }
    res.json({ success: true, data: { _id: req.params.id } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// --- Public: chỉ ảnh active ---
exports.getPublicGallery = async (req, res) => {
  try {
    const { category } = req.query
    const filter = { status: 'active' }
    if (category) filter.category = category
    const imgs = await GalleryImage.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean()
    res.json({ success: true, data: imgs.map(mapImg(req)) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
