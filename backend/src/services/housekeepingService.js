// Owner: Tú — HỢP ĐỒNG LIÊN-MODULE. Quốc gọi createOnCheckIn() khi check-in.
const HousekeepingTask = require('../models/housekeepingTaskModel')

/**
 * Tự sinh task dọn phòng/kiểm kê khi khách check-in.
 * Gọi bởi: bookingService.checkIn (Quốc).
 * @param {string} bookingId
 * @param {string} roomId
 * @returns {Promise<HousekeepingTask>}
 */
exports.createOnCheckIn = async (bookingId, roomId) => {
  // TODO(Tú): tạo HousekeepingTask gắn booking + room, status 'unassigned'.
  throw new Error('housekeepingService.createOnCheckIn chưa được cài đặt (Sprint 0 stub)')
}

// TODO(Tú): claimTask, startTask, completeTask, saveAmenityReport, reportIssue ...
