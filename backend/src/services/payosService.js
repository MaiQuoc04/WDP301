// Owner: Quốc — PayOS payment service
// Xử lý tạo QR thanh toán, xác minh webhook, cập nhật booking khi thanh toán xong
// SDK: @payos/node v2+ — payos.paymentRequests.create(), payos.webhooks.verify()
const payos = require('../config/payos')
const Payment = require('../models/paymentModel')
const Booking = require('../models/bookingModel')
const BookingGroup = require('../models/bookingGroupModel')
const bookingService = require('./bookingService')

const BACKEND_URL = process.env.BAC_END_URL || 'http://localhost:9999'
const CLIENT_URL  = process.env.CLIENT_URL  || 'http://localhost:3000'

/**
 * Sinh orderCode số nguyên dương ≤ 9007199254740991 (giới hạn PayOS)
 * Lấy 9 chữ số cuối timestamp (ms) + 4 chữ số random = 13 số an toàn
 */
function genOrderCode() {
  const ts   = String(Date.now()).slice(-9)                     // 9 chữ số cuối ms
  const rand = String(Math.floor(1000 + Math.random() * 9000)) // 4 chữ số
  return Number(ts + rand)
}

const QR_TTL_MS = 15 * 60 * 1000       // chỉ dùng khi KHÔNG có hạn giữ chỗ (walk-in / thu tiền còn lại)
const MIN_PAY_WINDOW_MS = 30 * 1000    // dưới mức này QR sinh ra cũng chết yểu -> báo rõ thay vì để PayOS ném lỗi khó hiểu

// MỘT ĐỒNG HỒ DUY NHẤT: hạn QR = ĐÚNG hạn giữ chỗ, KHÔNG cộng thêm từ thời điểm bấm.
// Vì mốc này suy ra từ booking.expiresAt (cố định lúc tạo) nên bấm "Thanh toán" lúc nào cũng ra cùng một mốc
// -> không gia hạn, không cộng dồn, spam bấm vô hại. Và "trả tiền sau khi mất phòng" là bất khả thi:
// còn quét được QR nghĩa là phòng vẫn đang giữ cho khách.
// holdUntil = null khi không có hạn giữ chỗ (walk-in, hoặc thu tiền còn lại lúc khách đang ở).
function payWindowEnd(holdUntil) {
  const now = Date.now()
  if (!holdUntil) return now + QR_TTL_MS
  const until = new Date(holdUntil).getTime()
  if (!Number.isFinite(until)) return now + QR_TTL_MS
  const left = until - now
  if (left <= MIN_PAY_WINDOW_MS)
    throw new Error(`Chỗ giữ phòng chỉ còn ${Math.max(0, Math.round(left / 1000))} giây — không đủ để thanh toán. Vui lòng đặt lại phòng.`)
  return until
}

// Trả về QR ĐANG SỐNG của booking/nhóm (nếu có) thay vì đẻ đơn PayOS mới mỗi lần bấm.
async function reuseLiveQR(filter, amount) {
  const p = await Payment.findOne({
    ...filter, method: 'online_qr', status: 'pending', amount,
    qrCode: { $ne: null }, expiredAt: { $gt: new Date() },
  }).sort('-createdAt')
  if (!p) return null
  return { qrCode: p.qrCode, checkoutUrl: p.checkoutUrl, amount: p.amount, orderCode: Number(p.transactionRef), paymentId: p._id, expiresAt: p.expiredAt.toISOString() }
}

// Thanh toán cho 1 NHÓM (cọc gom): đánh dấu Payment paid + xác nhận cả nhóm pending -> confirmed.
async function applyPaidGroupPayment(payment, transactionCode) {
  const group = await BookingGroup.findById(payment.group)
  if (!group) return { ok: true, message: 'Nhóm không tìm thấy' }

  let changed = false
  if (payment.status !== 'paid') { payment.status = 'paid'; payment.paidAt = new Date(); changed = true }
  if (transactionCode && payment.transactionCode !== transactionCode) { payment.transactionCode = transactionCode; changed = true }
  if (changed) await payment.save()

  if (payment.type === 'deposit') {
    const members = await Booking.find({ group: group._id, status: 'pending' })
    if (members.length) {
      const groupTotal = members.reduce((s, b) => s + (b.totalAmount || 0), 0)
      const paidFull = payment.amount >= groupTotal
      try {
        await bookingService.confirmGroupDeposit(group._id, {
          method: 'online_qr', transactionCode, paidFull, skipCreatePayment: true,
        })
        changed = true
      } catch (e) { console.warn('[PayOS] confirmGroupDeposit lỗi:', e.message) }
    }
    // Không còn phòng pending (đơn đã huỷ do quá ân hạn, hoặc đã thu rồi): không xử lý gì thêm.
    // Ca khách chuyển tiền sau ân hạn -> mất chỗ, hoàn tiền thủ công qua liên hệ lễ tân (chốt nghiệp vụ).
  } else if (payment.type === 'remaining') {
    // Tiền còn lại đã thu qua QR -> trả phòng cả nhóm (tự phân HK + hoàn tất), KHÔNG tạo lại giao dịch.
    try {
      await bookingService.checkOutGroup(group._id, { by: payment.confirmedBy, method: 'online_qr', skipPayment: true })
      changed = true
    } catch (e) { console.warn('[PayOS] checkOutGroup (remaining) lỗi:', e.message) }
  }

  if (changed) {
    try {
      const { getIO } = require('../config/socket')
      getIO().emit('payment_success', { groupId: group._id, orderCode: payment.transactionRef })
    } catch (e) { console.warn('[PayOS] socket emit (group) lỗi:', e.message) }
  }
  return { ok: true, message: 'Cập nhật thanh toán nhóm thành công' }
}

async function applyPaidPayment(payment, transactionCode) {
  if (payment.group) return applyPaidGroupPayment(payment, transactionCode)
  const booking = await Booking.findById(payment.booking)
  if (!booking) return { ok: true, message: 'Booking không tìm thấy' }

  let changed = false
  if (payment.status !== 'paid') {
    payment.status = 'paid'
    payment.paidAt = new Date()
    changed = true
  }
  if (transactionCode && payment.transactionCode !== transactionCode) {
    payment.transactionCode = transactionCode
    changed = true
  }
  if (changed) await payment.save()

  if (payment.type === 'deposit') {
    const paidFull = payment.amount >= booking.totalAmount

    if (booking.status === 'pending') {
      try {
        await bookingService.confirmDeposit(booking._id, {
          method: 'online_qr',
          transactionCode,
          by: payment.confirmedBy,
          skipCreatePayment: true,
          paidFull,
        })
        changed = true
      } catch (e) {
        console.warn('[PayOS] confirmDeposit lỗi:', e.message)
      }
    }
    // Booking không còn pending (đã huỷ do quá ân hạn, hoặc đã cọc rồi): không xử lý gì thêm.
    // Ca khách chuyển tiền sau ân hạn -> mất chỗ, hoàn tiền thủ công qua liên hệ lễ tân (chốt nghiệp vụ).
  } else if (payment.type === 'remaining') {
    booking.paidAmount = booking.totalAmount
    booking.remainingAmount = 0
    booking.paymentStatus = 'paid'
    await booking.save()
    changed = true
  }

  if (changed) {
    try {
      const { getIO } = require('../config/socket')
      getIO().emit('payment_success', { bookingId: booking._id, orderCode: payment.transactionRef })
    } catch (e) {
      console.warn('[PayOS] socket emit lỗi:', e.message)
    }
  }

  return { ok: true, message: 'Cập nhật thanh toán thành công' }
}

/**
 * Tạo link QR PayOS cho booking
 * @param {Object} booking — Mongoose document
 * @param {'deposit'|'full'|'remaining'} type
 * @param {string} [by] — accountId (lễ tân) hoặc undefined (customer)
 * @returns {{ qrCode, checkoutUrl, amount, orderCode, paymentId }}
 */
exports.createQR = async (booking, type, by) => {
  let amount, paymentType, paidFull = false

  if (type === 'deposit') {
    if (booking.status !== 'pending')
      throw new Error('Chỉ tạo QR cọc khi booking đang chờ cọc (pending)')
    amount = booking.depositAmount
    paymentType = 'deposit'
  } else if (type === 'full') {
    if (booking.status !== 'pending')
      throw new Error('Chỉ thanh toán toàn bộ khi booking đang chờ (pending)')
    amount = booking.totalAmount
    paymentType = 'deposit'  // gộp 1 lần
    paidFull = true
  } else if (type === 'remaining') {
    if (!['checked_in', 'confirmed'].includes(booking.status))
      throw new Error('Booking chưa ở trạng thái hợp lệ để thu tiền còn lại')
    amount = booking.remainingAmount
    if (amount <= 0) throw new Error('Không còn số dư cần thanh toán')
    paymentType = 'remaining'
  } else {
    throw new Error('Loại thanh toán không hợp lệ (deposit | full | remaining)')
  }

  if (amount < 1000)
    throw new Error(`Số tiền quá nhỏ (${amount}đ). PayOS yêu cầu tối thiểu 1.000đ`)

  // Đã có QR còn sống cho đúng khoản này -> trả về chính nó (không đẻ đơn mới -> không thể trả trùng).
  const live = await reuseLiveQR({ booking: booking._id, group: null, type: paymentType }, amount)
  if (live) return live

  // Thu tiền còn lại: khách đang ở, không còn giữ chỗ. Cọc/toàn bộ: hạn QR = hạn giữ chỗ.
  const endMs = payWindowEnd(type === 'remaining' ? null : booking.expiresAt)
  const orderCode = genOrderCode()

  // Lưu Payment record pending trước khi gọi PayOS
  const payment = await Payment.create({
    booking:        booking._id,
    type:           paymentType,
    method:         'online_qr',
    amount,
    status:         'pending',
    transactionRef: String(orderCode),
    expiredAt:      new Date(endMs),
    confirmedBy:    by || undefined,
  })

  // Chuẩn bị description (tối đa 25 ký tự, chỉ alphanumeric+space)
  const bookingCode = booking.code || String(booking._id).slice(-6).toUpperCase()
  const descRaw = `${bookingCode} ${type === 'remaining' ? 'tra phong' : 'dat coc'}`
  const description = descRaw.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25)

  const payosPayload = {
    orderCode,
    amount,
    description,
    returnUrl:  `${CLIENT_URL}/checkout/${booking._id}?payos=success`,
    cancelUrl:  `${CLIENT_URL}/checkout/${booking._id}?payos=cancel`,
    expiredAt:  Math.floor(endMs / 1000),
  }

  let payosRes
  try {
    payosRes = await payos.paymentRequests.create(payosPayload)
  } catch (err) {
    await Payment.deleteOne({ _id: payment._id })
    const msg = err?.error?.message || err?.message || JSON.stringify(err)
    throw new Error(`PayOS lỗi: ${msg}`)
  }

  // Lưu QR để lần bấm sau trả lại chính nó (paidFull suy ra từ amount lúc webhook về, không cần cờ riêng)
  payment.qrCode = payosRes.qrCode
  payment.checkoutUrl = payosRes.checkoutUrl
  await payment.save()

  return {
    qrCode:      payosRes.qrCode,       // base64 hoặc URL
    checkoutUrl: payosRes.checkoutUrl,
    amount,
    orderCode,
    paymentId:   payment._id,
    expiresAt:   new Date(endMs).toISOString(), // FE đếm ngược theo ĐÚNG mốc này, không tự cộng thời gian
  }
}

/**
 * Tạo link QR PayOS GOM cho cả NHÓM (1 QR cho nhiều phòng). 1 Payment gắn group + booking đại diện.
 *  - deposit  : cọc gom (các phòng pending)
 *  - full     : thanh toán toàn bộ 1 lần (các phòng pending)
 *  - remaining: thu tiền còn lại khi trả phòng (các phòng đang ở checked_in)
 * @param {Object} group — BookingGroup document
 * @param {'deposit'|'full'|'remaining'} type
 * @param {string} [by]
 */
exports.createGroupQR = async (group, type, by) => {
  const isRemaining = type === 'remaining'
  const members = await Booking.find({ group: group._id, status: isRemaining ? 'checked_in' : 'pending' })
  if (!members.length) throw new Error(isRemaining ? 'Nhóm không có phòng nào đang ở để thu tiền còn lại' : 'Nhóm không còn phòng nào chờ cọc')

  let amount, paymentType
  if (isRemaining) { amount = members.reduce((s, b) => s + Math.max(0, b.remainingAmount || 0), 0); paymentType = 'remaining' }
  else if (type === 'full') { amount = members.reduce((s, b) => s + (b.totalAmount || 0), 0); paymentType = 'deposit' }
  else { amount = members.reduce((s, b) => s + (b.depositAmount || 0), 0); paymentType = 'deposit' }
  if (amount < 1000) throw new Error(`Số tiền quá nhỏ (${amount}đ). PayOS yêu cầu tối thiểu 1.000đ`)

  // Đã có QR còn sống cho đúng khoản này -> trả về chính nó (không đẻ đơn mới -> không thể trả trùng).
  const live = await reuseLiveQR({ group: group._id, type: paymentType }, amount)
  if (live) return live

  // Thu tiền còn lại: khách đang ở, không còn giữ chỗ. Cọc/toàn bộ: hạn QR = hạn giữ chỗ của nhóm.
  const endMs = payWindowEnd(isRemaining ? null : group.expiresAt)
  const orderCode = genOrderCode()
  const payment = await Payment.create({
    booking: members[0]._id, group: group._id, type: paymentType, method: 'online_qr',
    amount, status: 'pending', transactionRef: String(orderCode),
    expiredAt: new Date(endMs), confirmedBy: by || undefined,
  })

  const groupCode = group.code || String(group._id).slice(-6).toUpperCase()
  const description = `${groupCode} ${isRemaining ? 'tra phong' : 'dat coc'}`.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25)
  const payosPayload = {
    orderCode, amount, description,
    returnUrl: `${CLIENT_URL}/checkout/group/${group._id}?payos=success`,
    cancelUrl: `${CLIENT_URL}/checkout/group/${group._id}?payos=cancel`,
    expiredAt: Math.floor(endMs / 1000),
  }

  let payosRes
  try {
    payosRes = await payos.paymentRequests.create(payosPayload)
  } catch (err) {
    await Payment.deleteOne({ _id: payment._id })
    const msg = err?.error?.message || err?.message || JSON.stringify(err)
    throw new Error(`PayOS lỗi: ${msg}`)
  }

  payment.qrCode = payosRes.qrCode
  payment.checkoutUrl = payosRes.checkoutUrl
  await payment.save()

  return { qrCode: payosRes.qrCode, checkoutUrl: payosRes.checkoutUrl, amount, orderCode, paymentId: payment._id, expiresAt: new Date(endMs).toISOString() }
}

/**
 * Xử lý webhook từ PayOS (POST /api/customer/payos-webhook)
 * Trả về { ok, message } — không throw (caller đã trả 200 trước)
 */
exports.handleWebhook = async (webhookBody) => {
  // Xác minh chữ ký với checksumKey
  let webhookData
  try {
    webhookData = await payos.webhooks.verify(webhookBody)
  } catch (err) {
    console.warn('[PayOS webhook] Xác minh thất bại:', err.message)
    return { ok: false, message: 'Chữ ký webhook không hợp lệ' }
  }

  // webhookData.code = '00' là thanh toán thành công
  const txData = webhookData.data || webhookData
  const orderCode = txData.orderCode || webhookData.orderCode
  const code = txData.code || webhookData.code
  const desc = txData.desc || webhookData.desc

  if (code !== '00') {
    console.log(`[PayOS webhook] Đơn ${orderCode} không thành công: ${code} - ${desc}`)
    return { ok: false, message: `Thanh toán không thành công: ${desc}` }
  }

  const transactionCode = txData.reference || txData.transactionId || String(orderCode)

  // Tìm Payment record
  const payment = await Payment.findOne({ transactionRef: String(orderCode) })
  if (!payment) {
    console.warn(`[PayOS webhook] Không tìm thấy payment orderCode=${orderCode}`)
    return { ok: true, message: 'Đã nhận (payment không tìm thấy trong DB)' }
  }

  return applyPaidPayment(payment, transactionCode)
}
exports.syncBookingPayments = async (bookingId) => {
  // Chỉ kiểm tra payment PENDING (chưa thanh toán) — payment đã paid không cần sync lại
  const payments = await Payment.find({
    booking: bookingId,
    method: 'online_qr',
    status: 'pending',
    transactionRef: { $exists: true, $ne: null },
  }).sort('-createdAt')

  let synced = 0
  for (const payment of payments) {
    let payosPayment
    try {
      payosPayment = await payos.paymentRequests.get(Number(payment.transactionRef))
    } catch (e) {
      console.warn(`[PayOS sync] Không lấy được orderCode=${payment.transactionRef}:`, e.message)
      continue
    }

    if (payosPayment.status === 'PAID') {
      const tx = Array.isArray(payosPayment.transactions) ? payosPayment.transactions[0] : null
      await applyPaidPayment(payment, tx?.reference || String(payment.transactionRef))
      synced += 1
    } else if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(payosPayment.status)) {
      payment.status = payosPayment.status === 'EXPIRED' ? 'expired' : 'failed'
      await payment.save()
    }
  }

  return { synced }
}

// Polling cho NHÓM: kiểm tra Payment pending của group đã PAID chưa (fallback khi webhook không tới localhost).
exports.syncGroupPayments = async (groupId) => {
  const payments = await Payment.find({
    group: groupId, method: 'online_qr', status: 'pending',
    transactionRef: { $exists: true, $ne: null },
  }).sort('-createdAt')

  let synced = 0
  for (const payment of payments) {
    let payosPayment
    try {
      payosPayment = await payos.paymentRequests.get(Number(payment.transactionRef))
    } catch (e) {
      console.warn(`[PayOS sync group] Không lấy được orderCode=${payment.transactionRef}:`, e.message)
      continue
    }
    if (payosPayment.status === 'PAID') {
      const tx = Array.isArray(payosPayment.transactions) ? payosPayment.transactions[0] : null
      await applyPaidPayment(payment, tx?.reference || String(payment.transactionRef))
      synced += 1
    } else if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(payosPayment.status)) {
      payment.status = payosPayment.status === 'EXPIRED' ? 'expired' : 'failed'
      await payment.save()
    }
  }
  return { synced }
}
