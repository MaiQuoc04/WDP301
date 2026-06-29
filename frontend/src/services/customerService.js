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
  searchAvailableRooms: async (params) => {
    const response = await axiosInstance.get('/public/rooms/available', { params })
    return response.data // { success, data: rooms }
  },
  createBooking: async (data) => {
    const response = await axiosInstance.post('/customer/bookings', data)
    return response.data
  },
  getBookingDetail: async (id) => {
    const response = await axiosInstance.get(`/customer/bookings/${id}`)
    return response.data
  },
  createPaymentLink: async (id, type) => {
    const response = await axiosInstance.post(`/customer/bookings/${id}/payos-link`, { type })
    return response.data
  },
  getBookingHistory: async () => {
    const response = await axiosInstance.get('/customer/bookings')
    return response.data
  },
  // TODO(Khánh): searchRooms, getRoomDetail, getBill, review ...
}
