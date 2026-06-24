// Job escalation task housekeeping: 2p chưa ai nhận -> nhắc HK; 5p -> báo manager + khoá tự nhận.
const housekeepingService = require('../services/housekeepingService')

const EVERY_MS = 30 * 1000 // mỗi 30s (mốc 2p/5p nên cần độ phân giải nhỏ hơn 60s)

function startTaskEscalationJob() {
  setInterval(async () => {
    try {
      const r = await housekeepingService.runEscalation()
      if (r.reminded || r.escalated) {
        console.log(`⏰ Escalation: nhắc ${r.reminded} task, chuyển quản lý ${r.escalated} task`)
      }
    } catch (e) {
      console.error('[taskEscalation]', e.message)
    }
  }, EVERY_MS)
  console.log('⏰ Task escalation job đã bật (mỗi 30s)')
}

module.exports = { startTaskEscalationJob }
