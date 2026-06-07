const mongoose = require('mongoose')

// Chặn sớm khi tham số :id không phải ObjectId hợp lệ -> 400 gọn,
// tránh CastError thô của Mongoose (lộ chi tiết model). Dùng chung cho mọi module.
// VD: router.get('/bookings/:id', validateObjectId('id'), controller)
exports.validateObjectId = (param = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
    return res.status(400).json({ success: false, message: 'ID không hợp lệ' })
  }
  next()
}
