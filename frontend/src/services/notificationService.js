// Owner: Quốc — thông báo dùng chung (lễ tân/housekeeper). Trả data đã unwrap.
import axiosInstance from './axiosInstance'

const base = '/notifications'
const get = (u, params) => axiosInstance.get(u, { params }).then((r) => r.data.data)
const patch = (u) => axiosInstance.patch(u).then((r) => r.data.data)

export const notificationService = {
  list: (params) => get(base, params),
  unreadCount: () => get(`${base}/unread-count`).then((d) => d.count),
  markRead: (id) => patch(`${base}/${id}/read`),
  markAllRead: () => patch(`${base}/read-all`),
}
