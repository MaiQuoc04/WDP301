// Khởi tạo PayOS SDK (@payos/node v2+)
// API mới: payos.paymentRequests.create(), payos.webhooks.verify()
const { PayOS } = require('@payos/node')

const payos = new PayOS({
  clientId:    process.env.PAYOS_CLIENT_ID,
  apiKey:      process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
})

module.exports = payos
