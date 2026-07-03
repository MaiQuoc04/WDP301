// Owner: Quốc — Bước 0: xoá data booking test để làm sạch trước khi thống nhất mô hình "mọi lần đặt = 1 nhóm".
// Xoá: Booking, BookingGroup, Payment, HoldRoom, BookingStatusHistory, HousekeepingTask (đều gắn booking).
// Reset: Room đang 'occupied'/'cleaning' (do booking gây ra) -> 'available', clear awaitingRestock.
//        KHÔNG đụng phòng 'maintenance'/'locked' (manager/roomIssue điều khiển, không phải data booking).
// Chạy:  node scripts/wipeBookingData.js          (hỏi xác nhận)
//        node scripts/wipeBookingData.js --yes     (chạy luôn)
require('dotenv').config()
const mongoose = require('mongoose')

const Booking = require('../src/models/bookingModel')
const BookingGroup = require('../src/models/bookingGroupModel')
const Payment = require('../src/models/paymentModel')
const HoldRoom = require('../src/models/holdRoomModel')
const BookingStatusHistory = require('../src/models/bookingStatusHistoryModel')
const HousekeepingTask = require('../src/models/housekeepingTaskModel')
const Room = require('../src/models/roomModel')

async function main() {
  if (!process.env.MONGO_URI) { console.error('❌ Thiếu MONGO_URI trong .env'); process.exit(1) }
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ MongoDB connected:', mongoose.connection.name)

  // Đếm trước để báo cáo
  const before = {
    bookings: await Booking.countDocuments(),
    groups: await BookingGroup.countDocuments(),
    payments: await Payment.countDocuments(),
    holds: await HoldRoom.countDocuments(),
    history: await BookingStatusHistory.countDocuments(),
    tasks: await HousekeepingTask.countDocuments(),
    roomsToReset: await Room.countDocuments({ status: { $in: ['occupied', 'cleaning'] } }),
  }
  console.table(before)

  if (!process.argv.includes('--yes')) {
    console.log('\n⚠️  Thêm cờ --yes để thực thi xoá. Đang thoát (chưa xoá gì).')
    await mongoose.disconnect(); return
  }

  const r = {
    bookings: (await Booking.deleteMany({})).deletedCount,
    groups: (await BookingGroup.deleteMany({})).deletedCount,
    payments: (await Payment.deleteMany({})).deletedCount,
    holds: (await HoldRoom.deleteMany({})).deletedCount,
    history: (await BookingStatusHistory.deleteMany({})).deletedCount,
    tasks: (await HousekeepingTask.deleteMany({})).deletedCount,
    roomsReset: (await Room.updateMany(
      { status: { $in: ['occupied', 'cleaning'] } },
      { $set: { status: 'available', awaitingRestock: false } }
    )).modifiedCount,
    awaitingCleared: (await Room.updateMany(
      { awaitingRestock: true },
      { $set: { awaitingRestock: false } }
    )).modifiedCount,
  }
  console.log('\n🧹 Đã xoá / reset:')
  console.table(r)
  console.log('Lưu ý: phòng maintenance/locked giữ nguyên (manager/roomIssue quản lý).')
  await mongoose.disconnect()
}

main().catch((e) => { console.error('❌ Lỗi:', e); process.exit(1) })
