// Owner: Khánh / Quốc — Customer APIs + PayOS integration
const bookingService = require('../services/bookingService')
const payosService   = require('../services/payosService')
const Booking        = require('../models/bookingModel')
const BookingGroup   = require('../models/bookingGroupModel')
const Customer       = require('../models/customerModel')

/* ── Tạo booking online ─────────────────────────────────────────── */
exports.createBooking = async (req, res) => {
  try {
    const { branchId, roomTypeId, checkIn, checkOut, adults, children, guestName, guestPhone } = req.body
    const adultCount = Number(adults ?? 1)
    const childCount = Number(children ?? 0)
    if (!Number.isInteger(adultCount) || adultCount < 1) {
      return res.status(400).json({ success: false, message: 'Số người lớn phải từ 1 trở lên' })
    }
    if (!Number.isInteger(childCount) || childCount < 0) {
      return res.status(400).json({ success: false, message: 'Số trẻ em không hợp lệ' })
    }
    // Đơn online LUÔN gắn với khách đang đăng nhập (route đã có protect).
    // customer field ref tới Customer profile, KHÔNG phải Account → tra theo account.
    const customer = await Customer.findOne({ account: req.user.id })
    if (!customer) {
      return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng. Vui lòng đăng nhập lại.' })
    }
    const booking = await bookingService.create({
      branchId, roomTypeId, checkIn, checkOut, adults: adultCount, children: childCount,
      guestName, guestPhone,
      source: 'online',
      customerId: customer._id,
    })
    res.status(201).json({ success: true, data: booking })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

exports.getBookingHistory = async (req, res) => {
  try {
    // Chỉ trả ĐÚNG đơn của khách đang đăng nhập (theo Customer profile của họ).
    const customer = await Customer.findOne({ account: req.user.id })
    if (!customer) return res.json({ success: true, data: [] })
    const bookings = await Booking.find({ customer: customer._id })
      .populate('roomType', 'name images')
      .populate('branch', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Lịch sử đặt phòng theo NHÓM (mỗi lần đặt = 1 thẻ) ──────────── */
exports.getBookingGroupHistory = async (req, res) => {
  try {
    const customer = await Customer.findOne({ account: req.user.id })
    if (!customer) return res.json({ success: true, data: [] })
    const groups = await BookingGroup.find({ customer: customer._id }).sort({ createdAt: -1 }).lean()
    const members = await Booking.find({ group: { $in: groups.map((g) => g._id) } })
      .populate('roomType', 'name images').populate('branch', 'name isActive').lean()
    const byGroup = {}
    members.forEach((m) => { (byGroup[String(m.group)] = byGroup[String(m.group)] || []).push(m) })
    const rows = groups.map((g) => {
      const ms = byGroup[String(g._id)] || []
      const roll = bookingService.groupRollup(ms)
      return {
        _id: g._id, code: g.code, guestName: g.guestName,
        checkIn: g.checkIn, checkOut: g.checkOut,
        branchName: ms[0]?.branch?.name,
        branchActive: ms[0]?.branch?.isActive !== false,
        image: ms.map((m) => m.roomType?.images?.[0]).find(Boolean) || null,
        roomTypeNames: [...new Set(ms.map((m) => m.roomType?.name).filter(Boolean))],
        ...roll, // status, roomCount, totalAmount, paidAmount, remainingAmount, paymentStatus, depositAmount
      }
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── Lấy chi tiết booking ───────────────────────────────────────── */
exports.getBookingDetail = async (req, res) => {
  try {
    await payosService.syncBookingPayments(req.params.id)
    const booking = await Booking.findById(req.params.id)
      .populate('roomType', 'name basePrice images')
      .populate('branch', 'name location hotline isActive')
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy booking' })
    res.json({ success: true, data: booking })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ── Tạo link QR PayOS (Customer tự thanh toán) ─────────────────── */
exports.createPaymentLink = async (req, res) => {
  try {
    const { id } = req.params
    const { type } = req.body // 'deposit' | 'full'

    const booking = await Booking.findById(id)
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy booking' })

    // Xác định type hợp lệ
    const validType = type === 'full' ? 'full' : 'deposit'
    const result = await payosService.createQR(booking, validType)

    res.json({ success: true, data: result })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

/* ── Đặt NHIỀU phòng online (nhóm) ──────────────────────────────── */
// Báo giá nhóm theo loại phòng + số lượng (auto chia khách). Không cần đăng nhập để xem giá.
exports.quoteBookingGroup = async (req, res) => {
  try {
    const { branchId, checkIn, checkOut, items, adults, children } = req.body
    const quote = await bookingService.quoteGroupOnline(branchId, checkIn, checkOut, items || [], Number(adults ?? 1), Number(children ?? 0))
    res.json({ success: true, data: quote })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// Tạo nhóm (gắn customer đang đăng nhập). Trả group + bookings.
exports.createBookingGroup = async (req, res) => {
  try {
    const { branchId, checkIn, checkOut, items, adults, children, guestName, guestPhone } = req.body
    const adultCount = Number(adults ?? 1), childCount = Number(children ?? 0)
    if (!Number.isInteger(adultCount) || adultCount < 1) return res.status(400).json({ success: false, message: 'Số người lớn phải từ 1 trở lên' })
    if (!Number.isInteger(childCount) || childCount < 0) return res.status(400).json({ success: false, message: 'Số trẻ em không hợp lệ' })
    const customer = await Customer.findOne({ account: req.user.id })
    if (!customer) return res.status(403).json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng. Vui lòng đăng nhập lại.' })
    const result = await bookingService.createGroupOnline({
      branchId, checkIn, checkOut, items, adults: adultCount, children: childCount,
      guestName, guestPhone, customerId: customer._id,
    })
    res.status(201).json({ success: true, data: { groupId: result.group._id, code: result.group.code, roomCount: result.group.roomCount } })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// Chi tiết nhóm của khách (đồng bộ PayOS trước -> trả group + members + rollup). Chỉ chủ nhóm xem được.
exports.getBookingGroupDetail = async (req, res) => {
  try {
    const customer = await Customer.findOne({ account: req.user.id })
    const group = await BookingGroup.findById(req.params.id)
    if (!group) return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm đặt phòng' })
    if (!customer || String(group.customer) !== String(customer._id))
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem nhóm này' })
    await payosService.syncGroupPayments(group._id)
    const detail = await bookingService.getGroupDetail(group._id)
    res.json({ success: true, data: detail })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Tạo QR PayOS cọc gom cho nhóm (chỉ chủ nhóm).
exports.createGroupPaymentLink = async (req, res) => {
  try {
    const { type } = req.body // 'deposit' | 'full'
    const customer = await Customer.findOne({ account: req.user.id })
    const group = await BookingGroup.findById(req.params.id)
    if (!group) return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm đặt phòng' })
    if (!customer || String(group.customer) !== String(customer._id))
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thanh toán nhóm này' })
    const result = await payosService.createGroupQR(group, type === 'full' ? 'full' : 'deposit')
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

/* ── Webhook từ PayOS (POST /api/customer/payos-webhook) ─────────── */
// PayOS gọi endpoint này sau khi customer quét QR và thanh toán xong.
// Endpoint PHẢI trả HTTP 200 OK cho PayOS để họ không retry.
exports.payosWebhook = async (req, res) => {
  // Trả 200 ngay để PayOS không timeout, xử lý async
  res.json({ success: true })

  try {
    await payosService.handleWebhook(req.body)
  } catch (err) {
    console.error('[PayOS Webhook] Lỗi xử lý:', err.message)
  }
}
