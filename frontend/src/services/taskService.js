import axiosInstance from './axiosInstance'

const base = '/housekeeping'
const get = (url, params) => axiosInstance.get(url, { params }).then((res) => res.data.data)
const patch = (url, data) => axiosInstance.patch(url, data || {}).then((res) => res.data.data)
const post = (url, data) => axiosInstance.post(url, data || {}).then((res) => res.data.data)
const put = (url, data) => axiosInstance.put(url, data || {}).then((res) => res.data.data)

// Owner: Tu - Housekeeper APIs (UC-44 -> UC-55)
export const taskService = {
  getDashboard: () => get(`${base}/dashboard`),
  listTasks: (params) => get(`${base}/tasks`, params),
  getTaskDetail: (id) => get(`${base}/tasks/${id}`),
  claimTask: (id) => patch(`${base}/tasks/${id}/claim`),
  startTask: (id) => patch(`${base}/tasks/${id}/start`),
  saveAmenityReport: (id, report) => put(`${base}/tasks/${id}/amenity-report`, { report }),
  reportIssue: (id, data) => post(`${base}/tasks/${id}/issues`, data),
  markMaintenance: (id, data) => patch(`${base}/tasks/${id}/maintenance`, data),
  completeTask: (id) => patch(`${base}/tasks/${id}/complete`),
  getHistory: (params) => get(`${base}/history`, params),
}
