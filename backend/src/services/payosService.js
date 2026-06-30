// Owner: Quốc — PayOS payment service
// Xử lý tạo QR thanh toán, xác minh webhook, cập nhật booking khi thanh toán xong
// SDK: @payos/node v2+ — payos.paymentRequests.create(), payos.webhooks.verify()
const payos = require('../config/payos')
const Payment = require('../models/paymentModel')
const Booking = require('../models/bookingModel')
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

async function applyPaidPayment(payment, transactionCode) {
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
    } else if (booking.status === 'cancelled' && booking.cancelReason === 'payment_timeout') {
      const conflict = await Booking.exists({
        _id: { $ne: booking._id },
        room: booking.room,
        status: { $in: ['pending', 'confirmed', 'checked_in'] },
        checkIn: { $lt: booking.checkOut },
        checkOut: { $gt: booking.checkIn },
      })

      if (conflict) {
        console.warn(`[PayOS] Booking ${booking.code} đã thanh toán nhưng phòng đã bị chiếm, cần xử lý thủ công`)
        return { ok: false, message: 'Phòng đã bị chiếm, cần xử lý thủ công' }
      }

      const fromStatus = booking.status
      booking.status = 'confirmed'
      booking.cancelReason = undefined
      booking.expiresAt = undefined
      booking.paidAmount = paidFull ? booking.totalAmount : booking.depositAmount
      booking.remainingAmount = booking.totalAmount - booking.paidAmount
      booking.paymentStatus = paidFull ? 'paid' : 'partial'
      await booking.save()
      await bookingService.logStatus(
        booking._id,
        fromStatus,
        'confirmed',
        payment.confirmedBy,
        'Khôi phục sau khi PayOS xác nhận thanh toán'
      )
      changed = true
    }
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

  const orderCode = genOrderCode()

  // Lưu Payment record pending trước khi gọi PayOS
  const payment = await Payment.create({
    booking:        booking._id,
    type:           paymentType,
    method:         'online_qr',
    amount,
    status:         'pending',
    transactionRef: String(orderCode),
    expiredAt:      new Date(Date.now() + 15 * 60 * 1000),
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
    expiredAt:  Math.floor((Date.now() + 15 * 60 * 1000) / 1000),
  }

  let payosRes
  try {
    payosRes = await payos.paymentRequests.create(payosPayload)
  } catch (err) {
    await Payment.deleteOne({ _id: payment._id })
    const msg = err?.error?.message || err?.message || JSON.stringify(err)
    throw new Error(`PayOS lỗi: ${msg}`)
  }

  // Gắn paidFull vào payment để webhook biết
  if (paidFull) {
    payment._paidFull = true
    await payment.save()
  }

  return {
    qrCode:      payosRes.qrCode,       // base64 hoặc URL
    checkoutUrl: payosRes.checkoutUrl,
    amount,
    orderCode,
    paymentId:   payment._id,
  }
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
