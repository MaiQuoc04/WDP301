// Khởi tạo PayOS SDK (@payos/node v2+)
// API mới: payos.paymentRequests.create(), payos.webhooks.verify()
const { PayOS } = require('@payos/node')

const payos = new PayOS({
  clientId:    process.env.PAYOS_CLIENT_ID || 'dummy_client_id',
  apiKey:      process.env.PAYOS_API_KEY || 'dummy_api_key',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key',
})

module.exports = payos

