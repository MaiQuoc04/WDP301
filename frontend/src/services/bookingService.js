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
  listBookings: (params) => get(`${base}/bookings`, params),
  getBooking: (id) => get(`${base}/bookings/${id}`),
  getBill: (id) => get(`${base}/bookings/${id}/bill`),
  walkIn: (data) => post(`${base}/bookings`, data),
  confirmDeposit: (id, data) => post(`${base}/bookings/${id}/confirm-deposit`, data || {}),
  checkIn: (id, data) => post(`${base}/bookings/${id}/check-in`, data || {}),
  checkOut: (id, data) => post(`${base}/bookings/${id}/check-out`, data || {}),
  complete: (id) => post(`${base}/bookings/${id}/complete`, {}),
  cancel: (id, data) => post(`${base}/bookings/${id}/cancel`, data || {}),
  noShow: (id) => post(`${base}/bookings/${id}/no-show`, {}),
  transfer: (id, data) => post(`${base}/bookings/${id}/transfer`, data),
  update: (id, data) => patch(`${base}/bookings/${id}`, data),
  addService: (id, data) => post(`${base}/bookings/${id}/services`, data),
  removeService: (id, lineId) => del(`${base}/bookings/${id}/services/${lineId}`),
  addMissingAmenity: (id, data) => post(`${base}/bookings/${id}/missing-amenities`, data),
  removeMissingAmenity: (id, lineId) => del(`${base}/bookings/${id}/missing-amenities/${lineId}`),
  setBedSurcharge: (id, apply) => post(`${base}/bookings/${id}/bed-surcharge`, { apply }),
  schedule: (params) => get(`${base}/schedule`, params),
  transactions: (params) => get(`${base}/transactions`, params),
}

export const vnd = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '')
