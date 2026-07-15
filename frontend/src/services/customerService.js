import axiosInstance from './axiosInstance'
import { ENDPOINTS } from '../constants'
// Owner: Khánh — Guest/Customer APIs (UC-01→25)
export const customerService = {
  getPublicRooms: async () => {
    const response = await axiosInstance.get('/public/rooms')
    return response.data
  },
  getHomeData: async () => {
    const response = await axiosInstance.get('/public/home-data')
    return response.data
  },
  getBranches: async () => {
    const response = await axiosInstance.get('/public/branches')
    return response.data // { success, data: branches }
  },
  getGallery: async (category) => {
    const response = await axiosInstance.get('/public/gallery', { params: { category } })
    return response.data // { success, data: [{imageUrl, caption, category, ...}] }
  },
  submitContact: async (data) => {
    const response = await axiosInstance.post('/public/contact', data)
    return response.data // { success, data: { _id } }
  },
  searchAvailableRooms: async (params) => {
    const response = await axiosInstance.get('/public/rooms/available', { params })
    return response.data // { success, data: rooms }
  },
  // ── Đặt nhiều phòng online (nhóm) ──
  quoteBookingGroup: async (data) => {
    const response = await axiosInstance.post('/customer/booking-groups/quote', data)
    return response.data // { success, data: quote }
  },
  createBookingGroup: async (data) => {
    const response = await axiosInstance.post('/customer/booking-groups', data)
    return response.data // { success, data: { groupId, code, roomCount } }
  },
  getBookingGroupHistory: async () => {
    const response = await axiosInstance.get('/customer/booking-groups')
    return response.data // { success, data: [groupRow] }
  },
  getBookingGroup: async (id) => {
    const response = await axiosInstance.get(`/customer/booking-groups/${id}`)
    return response.data // { success, data: { group, members, payments, rollup } }
  },
  createGroupPaymentLink: async (id, type) => {
    const response = await axiosInstance.post(`/customer/booking-groups/${id}/payos-link`, { type })
    return response.data
  },
  cancelBookingGroup: async (id) => {
    const response = await axiosInstance.post(`/customer/booking-groups/${id}/cancel`)
    return response.data
  },

  // ----- Đánh giá chi nhánh (UC-22) -----
  // Backend quyết ai được đánh giá (online + đã ở xong + trong 14 ngày + chưa đánh giá),
  // FE chỉ hỏi "lần ở nào được phép" rồi hiện nút — không tự suy luật ở client.
  getReviewableStays: async () => {
    const response = await axiosInstance.get('/customer/reviews/reviewable')
    return response.data // { success, data: [{ groupId, code, branch, checkOut, roomCount, expiresAt }] }
  },
  getMyReviews: async () => {
    const response = await axiosInstance.get('/customer/reviews/mine')
    return response.data
  },
  createReview: async (data) => {
    const response = await axiosInstance.post('/customer/reviews', data) // { groupId, rating, comment }
    return response.data
  },
  // params: { star?: 1-5, skip?, limit? }
  getBranchReviews: async (branchId, params = {}) => {
    const response = await axiosInstance.get(`/public/branches/${branchId}/reviews`, { params })
    return response.data // { success, data: { items, total, hasMore } }
  },
  getBranchRating: async (branchId) => {
    const response = await axiosInstance.get(`/public/branches/${branchId}/rating`)
    return response.data // { success, data: { average, count, breakdown: {1..5} } }
  },
  // TODO(Khánh): searchRooms, getRoomDetail, getBill ...
}
