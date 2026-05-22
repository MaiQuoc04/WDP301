const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const fileFilter = (req, file, cb) => {
  /jpeg|jpg|png|pdf/.test(path.extname(file.originalname).toLowerCase())
    ? cb(null, true) : cb(new Error('File type not supported'))
}
module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })
