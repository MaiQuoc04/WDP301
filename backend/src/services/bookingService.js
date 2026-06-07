// Owner: Quốc — HỢP ĐỒNG LIÊN-MODULE. Khánh (booking online) gọi create().
// Đây là nguồn sự thật cho vòng đời booking; đừng tự sửa Booking ở module khác.
const Booking = require('../models/bookingModel')

/**
 * Tạo booking + tính tiền cọc theo depositRate của branch.
 * Dùng bởi: customer online (Khánh) và walk-in (Quốc).
 * @param {Object} payload - { branch, roomType, customer|guest, checkIn, checkOut, guests, source }
 * @returns {Promise<Booking>}
 */
exports.create = async (payload) => {
  // TODO(Quốc): validate phòng trống (HoldRoom), tính roomCharge từ RoomPrice,
  //   tính depositAmount, sinh code, lưu Booking ở trạng thái 'pending'.
  throw new Error('bookingService.create chưa được cài đặt (Sprint 0 stub)')
}

// TODO(Quốc): checkIn, checkOut, addExtraService, addMissingAmenity, recalcBill,
//   cancel, markNoShow, transferRoom, updateBooking ...
