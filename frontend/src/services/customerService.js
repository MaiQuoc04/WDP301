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
  // TODO(Khánh): searchRooms, getRoomDetail, createBooking, getBookingHistory, getBill, review ...
}
