// Job cảnh báo task dọn phòng quá hạn BẮT ĐẦU (mặc định 20' kể từ khi việc tới lượt HK).
// Báo cho HK phụ trách + quản lý chi nhánh. Mốc/ngưỡng xem CLEAN_START_SLA_MIN trong housekeepingService.
const housekeepingService = require('../services/housekeepingService')

const EVERY_MS = 60 * 1000 // mỗi phút — đủ mịn cho hạn tính bằng chục phút

function startCleaningSlaJob() {
  setInterval(async () => {
    try {
      const n = await housekeepingService.notifyOverdueCleaning()
      if (n) console.log(`🧹 Cảnh báo ${n} task dọn quá hạn bắt đầu`)
    } catch (e) {
      console.error('[cleaningSla]', e.message)
    }
  }, EVERY_MS)
  console.log('🧹 Cleaning SLA job đã bật (mỗi 60s)')
}

module.exports = { startCleaningSlaJob }
