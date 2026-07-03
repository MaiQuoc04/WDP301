// Owner: Quốc — Reception APIs (UC-26→43). Trả về data đã unwrap; lỗi ném ra (err.response.data.message).
import axiosInstance from './axiosInstance'

const base = '/reception'
const get = (u, params) => axiosInstance.get(u, { params }).then((r) => r.data.data)
const post = (u, data) => axiosInstance.post(u, data).then((r) => r.data.data)
const patch = (u, data) => axiosInstance.patch(u, data).then((r) => r.data.data)
const del = (u) => axiosInstance.delete(u).then((r) => r.data.data)

export const bookingService = {
  listServices: () => get(`${base}/services`),
  listAmenities: () => get(`${base}/amenities`),
  listRooms: (params) => get(`${base}/rooms`, params),
  searchRooms: (params) => get(`${base}/rooms/available`, params),
  listBookings: (params) => get(`${base}/bookings`, params),
  getBooking: (id) => get(`${base}/bookings/${id}`),
  getBill: (id) => get(`${base}/bookings/${id}/bill`),
  walkIn: (data) => post(`${base}/bookings`, data),
  // Đặt nhiều phòng (nhóm): báo giá theo phân bổ khách, tạo nhóm, xem chi tiết, thu cọc gom
  quoteGroup: (data) => post(`${base}/booking-groups/quote`, data),
  createGroup: (data) => post(`${base}/booking-groups`, data),
  getGroup: (id) => get(`${base}/booking-groups/${id}`),
  confirmGroupDeposit: (id, data) => post(`${base}/booking-groups/${id}/confirm-deposit`, data || {}),
  confirmDeposit: (id, data) => post(`${base}/bookings/${id}/confirm-deposit`, data || {}),
  createDepositQR: (id) => post(`${base}/bookings/${id}/deposit-qr`, {}),
  checkIn: (id, data) => post(`${base}/bookings/${id}/check-in`, data || {}),
  checkOut: (id, data) => post(`${base}/bookings/${id}/check-out`, data || {}),
  // PayOS QR checkout — lễ tân gen QR, khách quét QR để trả số dư
  createCheckoutQR: (id) => post(`${base}/bookings/${id}/checkout-qr`, {}),
  // Tiền mặt checkout — không cần QR, lễ tân xác nhận trực tiếp
  checkOutCash: (id, data) => post(`${base}/bookings/${id}/checkout-cash`, data || {}),
  // Polling: kiểm tra PayOS đã nhận tiền chưa (fallback khi webhook không tới)
  syncPayments: (id) => post(`${base}/bookings/${id}/sync-payments`, {}),
  complete: (id) => post(`${base}/bookings/${id}/complete`, {}),
  cancel: (id, data) => post(`${base}/bookings/${id}/cancel`, data || {}),
  noShow: (id) => post(`${base}/bookings/${id}/no-show`, {}),
  transfer: (id, data) => post(`${base}/bookings/${id}/transfer`, data),
  update: (id, data) => patch(`${base}/bookings/${id}`, data),
  addService: (id, data) => post(`${base}/bookings/${id}/services`, data),
  removeService: (id, lineId) => del(`${base}/bookings/${id}/services/${lineId}`),
  serviceBoard: () => get(`${base}/service-board`),
  setServiceDelivered: (id, lineId, delivered) => patch(`${base}/bookings/${id}/services/${lineId}`, { delivered }),
  requestInspection: (id, housekeeperId) => post(`${base}/bookings/${id}/request-inspection`, { housekeeperId }),
  requestCleaning: (id, housekeeperId) => post(`${base}/bookings/${id}/request-cleaning`, { housekeeperId }),
  getBookingHousekeeping: (id) => get(`${base}/bookings/${id}/housekeeping`),
  getHousekeepers: (id) => get(`${base}/bookings/${id}/housekeepers`),
  addMissingAmenity: (id, data) => post(`${base}/bookings/${id}/missing-amenities`, data),
  removeMissingAmenity: (id, lineId) => del(`${base}/bookings/${id}/missing-amenities/${lineId}`),
  setBedSurcharge: (id, apply) => post(`${base}/bookings/${id}/bed-surcharge`, { apply }),
  setEarlyCheckin: (id, hours) => post(`${base}/bookings/${id}/early-checkin`, { hours }),
  setLateCheckout: (id, hours) => post(`${base}/bookings/${id}/late-checkout`, { hours }),
  schedule: (params) => get(`${base}/schedule`, params),
  transactions: (params) => get(`${base}/transactions`, params),
  dashboard: () => get(`${base}/dashboard`),
  // Hộp thư liên hệ (khách gửi từ trang Contact)
  contacts: (params) => get(`${base}/contacts`, params),
  handleContact: (id) => patch(`${base}/contacts/${id}/handle`),
}

export const vnd = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '')

// Nhãn trạng thái booking (DB enum -> tiếng Việt dễ hiểu cho lễ tân)
export const BOOKING_STATUS_LABEL = {
  pending: 'Chờ cọc',
  confirmed: 'Đã cọc',
  checked_in: 'Đã nhận phòng',
  checked_out: 'Đã trả phòng',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  no_show: 'Vắng (no-show)',
}
export const bookingStatusLabel = (s) => BOOKING_STATUS_LABEL[s] || s

// Nhãn trạng thái thanh toán
export const PAYMENT_STATUS_LABEL = {
  unpaid: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
}
export const paymentStatusLabel = (s) => PAYMENT_STATUS_LABEL[s] || s
