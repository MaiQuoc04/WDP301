// Owner: Khánh — đánh giá chi nhánh (UC-22→25).
const svc = require('../services/reviewService')

const handle = (fn, code = 200) => async (req, res) => {
  try { res.status(code).json({ success: true, data: await fn(req) }) }
  catch (err) { res.status(err.status || 400).json({ success: false, message: err.message }) }
}

// --- Khách (cần đăng nhập) ---
exports.listReviewable = handle((req) => svc.listReviewable(req.user.id)) // lần ở nào đang được phép đánh giá
exports.listMine = handle((req) => svc.listMine(req.user.id))
exports.create = handle((req) => svc.create(req.user.id, req.body), 201)

// --- Công khai ---
exports.listByBranch = handle((req) => svc.listByBranch(req.params.id, req.query))
exports.ratingSummary = handle((req) => svc.ratingSummary(req.params.id))
