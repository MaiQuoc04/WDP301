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
  // TODO(Khánh): searchRooms, getRoomDetail, getBookingHistory, getBill, review ...
}
