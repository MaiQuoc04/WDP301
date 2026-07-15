// Owner: Khánh — đánh giá chi nhánh (UC-22→25).
//
// Luật: chỉ khách ĐẶT ONLINE và ĐÃ Ở XONG mới review được, trong vòng 14 ngày kể từ ngày trả,
// mỗi lần đi ở đúng 1 review. Khách tại quầy (walk-in) không có tài khoản -> không review.
const Review = require('../models/reviewModel')
const BookingGroup = require('../models/bookingGroupModel')
const Booking = require('../models/bookingModel')
const Customer = require('../models/customerModel')
const bookingService = require('./bookingService')

const REVIEW_WINDOW_DAYS = 14 // hết hạn này thì thôi, đánh giá quá cũ không còn phản ánh hiện tại

function fail(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

const windowEndsAt = (checkOut) => new Date(checkOut).getTime() + REVIEW_WINDOW_DAYS * 86400000

// Account -> Customer (review gắn với Customer, còn token mang Account).
async function myCustomer(accountId) {
  const c = await Customer.findOne({ account: accountId }).select('_id').lean()
  if (!c) fail('Tài khoản chưa có hồ sơ khách hàng', 403)
  return c._id
}

// Nhóm đã ở XONG hẳn chưa. Dùng lại groupRollup của bookingService thay vì tự chế luật:
// rollup loại cancelled/no_show ra khỏi phần đang xét, nên 'completed' = mọi phòng CÒN HIỆU LỰC
// đều đã trả xong. Nhóm toàn no-show -> 'no_show' (không ở thì không chấm). Nhóm còn 1 phòng
// đang ở -> chưa 'completed' (chưa đi về thì chưa chấm).
async function rollupOf(groupId) {
  const members = await Booking.find({ group: groupId }).select('status totalAmount paidAmount remainingAmount depositAmount').lean()
  return bookingService.groupRollup(members)
}

// Các lần đi ở khách được phép đánh giá NGAY BÂY GIỜ (để FE hiện nút "Đánh giá").
exports.listReviewable = async (accountId) => {
  const customerId = await myCustomer(accountId)
  const since = new Date(Date.now() - REVIEW_WINDOW_DAYS * 86400000)
  // Lọc thô ở DB trước (đúng khách + đặt online + trả phòng trong 14 ngày) rồi mới tính rollup —
  // rollup phải đọc member nên đừng chạy nó cho mọi nhóm từ đời nào.
  const groups = await BookingGroup.find({
    customer: customerId, source: 'online', checkOut: { $gte: since },
  }).populate('branch', 'name').sort('-checkOut').lean()
  if (!groups.length) return []

  const reviewed = await Review.find({ group: { $in: groups.map((g) => g._id) } }).select('group').lean()
  const done = new Set(reviewed.map((r) => String(r.group)))

  const out = []
  for (const g of groups) {
    if (done.has(String(g._id))) continue
    const roll = await rollupOf(g._id)
    if (roll.status !== 'completed') continue
    out.push({
      groupId: g._id, code: g.code,
      branch: g.branch, checkIn: g.checkIn, checkOut: g.checkOut,
      roomCount: roll.roomCount,
      expiresAt: new Date(windowEndsAt(g.checkOut)), // FE hiện "còn N ngày để đánh giá"
    })
  }
  return out
}

exports.create = async (accountId, { groupId, rating, comment } = {}) => {
  const customerId = await myCustomer(accountId)
  const r = Number(rating)
  if (!Number.isInteger(r) || r < 1 || r > 5) fail('Điểm đánh giá phải từ 1 đến 5 sao')
  if (comment && String(comment).length > 2000) fail('Nhận xét quá dài (tối đa 2000 ký tự)')

  const group = await BookingGroup.findById(groupId).lean()
  if (!group) fail('Không tìm thấy lần đặt phòng', 404)
  // Của chính mình — chặn lấy id nhóm người khác để chấm hộ.
  if (String(group.customer || '') !== String(customerId)) fail('Bạn chỉ đánh giá được lần ở của chính mình', 403)
  // walk-in không có tài khoản nên về lý thuyết không tới đây được; chặn cho chắc.
  if (group.source !== 'online') fail('Chỉ đơn đặt online mới đánh giá được')

  const roll = await rollupOf(groupId)
  if (roll.status !== 'completed') {
    fail(roll.status === 'no_show' ? 'Lần đặt này không có ai nhận phòng nên không đánh giá được'
      : 'Chỉ đánh giá được sau khi đã trả phòng xong')
  }
  if (Date.now() > windowEndsAt(group.checkOut)) {
    fail(`Đã quá hạn đánh giá (${REVIEW_WINDOW_DAYS} ngày kể từ ngày trả phòng)`)
  }

  try {
    // branch LẤY TỪ NHÓM, không nhận từ client -> không thể chấm chi nhánh mình chưa từng ở.
    return await Review.create({
      group: group._id, customer: customerId, branch: group.branch,
      rating: r, comment: (comment || '').trim(),
    })
  } catch (e) {
    // 11000 = đụng unique index {group} -> đã đánh giá lần ở này rồi (kể cả khi 2 request đua nhau).
    if (e.code === 11000) fail('Bạn đã đánh giá lần ở này rồi')
    throw e
  }
}

// Review của chính khách (để xem lại những gì mình đã viết).
exports.listMine = async (accountId) => {
  const customerId = await myCustomer(accountId)
  return Review.find({ customer: customerId })
    .populate('branch', 'name').populate('group', 'code checkIn checkOut')
    .sort('-createdAt').lean()
}

// ----- Công khai -----
exports.listByBranch = async (branchId, { limit = 20 } = {}) => {
  return Review.find({ branch: branchId, status: 'active' })
    .populate('customer', 'fullName')
    .sort('-createdAt').limit(Math.min(Number(limit) || 20, 50)).lean()
}

// Điểm trung bình + số lượt của 1 chi nhánh (hoặc tất cả nếu không truyền).
exports.ratingSummary = async (branchId) => {
  const match = { status: 'active' }
  if (branchId) match.branch = new (require('mongoose').Types.ObjectId)(String(branchId))
  const [agg] = await Review.aggregate([
    { $match: match },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  return { average: agg ? Math.round(agg.avg * 10) / 10 : 0, count: agg ? agg.count : 0 }
}

exports.REVIEW_WINDOW_DAYS = REVIEW_WINDOW_DAYS
