// Owner: Hoàng — Branch Manager APIs (UC-56→70)
import axiosInstance from './axiosInstance'
import { ENDPOINTS } from '../constants'

const base = ENDPOINTS.MANAGER

const get = (u, params) => axiosInstance.get(u, { params }).then((r) => r.data.data)
const post = (u, data) => axiosInstance.post(u, data).then((r) => r.data.data)
const put = (u, data) => axiosInstance.put(u, data).then((r) => r.data.data)
const patch = (u, data) => axiosInstance.patch(u, data).then((r) => r.data.data)
const del = (u) => axiosInstance.delete(u).then((r) => r.data.data)

export const roomService = {
  // Room Types
  getRoomTypes: () => get(base.ROOM_TYPES),
  getRoomTypeOptions: () => get(base.ROOM_TYPE_OPTIONS),
  getRoomTypeById: (id) => get(`${base.ROOM_TYPES}/${id}`),
  createRoomType: (data) => post(base.ROOM_TYPES, data),
  updateRoomType: (id, data) => put(`${base.ROOM_TYPES}/${id}`, data),
  updateRoomTypeStatus: (id, status) => patch(`${base.ROOM_TYPES}/${id}/status`, { status }),

  // Rooms
  getRooms: (params) => get(base.ROOMS, params),
  getRoomById: (id) => get(`${base.ROOMS}/${id}`),
  createRoom: (data) => post(base.ROOMS, data),
  updateRoom: (id, data) => put(`${base.ROOMS}/${id}`, data),
  updateRoomStatus: (id, status) => patch(`${base.ROOMS}/${id}/status`, { status }),
  deactivateRoom: (id) => patch(`${base.ROOMS}/${id}/deactivate`),

  // Room Prices (Dynamic pricing)
  getRoomPrices: () => get(base.ROOM_PRICES),
  createOrUpdateRoomPrice: (data) => post(base.ROOM_PRICES, data),
  deleteRoomPrice: (id) => del(`${base.ROOM_PRICES}/${id}`),

  // Amenities
  getAmenities: () => get(base.AMENITIES),
  getAmenityOptions: () => get(base.AMENITY_OPTIONS),
  createAmenity: (data) => post(base.AMENITIES, data),
  updateAmenity: (id, data) => put(`${base.AMENITIES}/${id}`, data),
  deactivateAmenity: (id) => patch(`${base.AMENITIES}/${id}/deactivate`),

  // Room Type Amenities mapping
  getRoomTypeAmenities: (id) => get(`${base.ROOM_TYPES}/${id}/amenities`),
  updateRoomTypeAmenities: (id, amenityIds) => put(`${base.ROOM_TYPES}/${id}/amenities`, { amenityIds }),

  // Services
  getServices: () => get(base.SERVICES),
  getServiceOptions: () => get(base.SERVICE_OPTIONS),
  getServiceById: (id) => get(`${base.SERVICES}/${id}`),
  createService: (data) => post(base.SERVICES, data),
  updateService: (id, data) => put(`${base.SERVICES}/${id}`, data),
  deactivateService: (id) => patch(`${base.SERVICES}/${id}/deactivate`),

  // Room Issues
  getRoomIssues: (params) => get(base.ROOM_ISSUES, params),
  getRoomIssueById: (id) => get(`${base.ROOM_ISSUES}/${id}`),
  createRoomIssue: (data) => post(base.ROOM_ISSUES, data),
  resolveRoomIssue: (id, data) => patch(`${base.ROOM_ISSUES}/${id}/resolve`, data),
  cancelRoomIssue: (id, data) => patch(`${base.ROOM_ISSUES}/${id}/cancel`, data),

  // Housekeeping Tasks
  getHousekeepingTasks: (params) => get(base.HOUSEKEEPING_TASKS, params),
  getHousekeepingTaskById: (id) => get(`${base.HOUSEKEEPING_TASKS}/${id}`),
  assignHousekeepingTask: (id, assignedTo) => patch(`${base.HOUSEKEEPING_TASKS}/${id}/assign`, { assignedTo }),
  markHousekeepingTaskUrgent: (id) => patch(`${base.HOUSEKEEPING_TASKS}/${id}/urgent`),
  createRoomIssueFromTask: (taskId, data) => post(`${base.HOUSEKEEPING_TASKS}/${taskId}/issues`, data),

  // Housekeepers staff list
  getHousekeepers: () => get(base.HOUSEKEEPERS),
}


