// Job tự huỷ booking pending quá hạn cọc (chạy định kỳ). Bịt rò rỉ phòng do booking online bị bỏ rơi.
const bookingService = require('../services/bookingService')

const EVERY_MS = 60 * 1000 // mỗi phút

function startBookingExpiryJob() {
  setInterval(async () => {
    try {
      const n = await bookingService.expirePendingBookings()
      if (n) console.log(`⏰ Tự huỷ ${n} booking quá hạn cọc`)
    } catch (e) {
      console.error('[bookingExpiry]', e.message)
    }
  }, EVERY_MS)
  console.log('⏰ Booking expiry job đã bật (mỗi 60s)')
}

module.exports = { startBookingExpiryJob }
