import axiosInstance from './axiosInstance'

const adminService = {
  // Branches
  getBranches: () => axiosInstance.get('/admin/branches').then(res => res.data.data),
  createBranch: (data) => axiosInstance.post('/admin/branches', data).then(res => res.data.data),
  updateBranch: (id, data) => axiosInstance.put(`/admin/branches/${id}`, data).then(res => res.data.data),
  toggleBranchActive: (id) => axiosInstance.patch(`/admin/branches/${id}/deactivate`).then(res => res.data.data),

  // Staff & Accounts
  getAllStaff: () => axiosInstance.get('/admin/staff').then(res => res.data.data),
  createStaff: (data) => axiosInstance.post('/admin/staff', data).then(res => res.data.data),
  toggleAccountActive: (id) => axiosInstance.patch(`/admin/accounts/${id}/deactivate`).then(res => res.data.data),
  changeStaffRole: (id, role) => axiosInstance.put(`/admin/staff/${id}/role`, { role }).then(res => res.data.data),
  assignStaffBranch: (id, branchId) => axiosInstance.post(`/admin/staff/${id}/assignments`, { branchId }).then(res => res.data.data),
  removeStaffBranch: (assignmentId) => axiosInstance.delete(`/admin/staff/assignments/${assignmentId}`).then(res => res.data.data),
  getAllAccounts: (role) => axiosInstance.get('/admin/users', { params: { role } }).then(res => res.data.data),
  getDashboardStats: () => axiosInstance.get('/admin/dashboard/stats').then(res => res.data.data),
  getBranchDashboard: (branchId) => axiosInstance.get(`/admin/dashboard/branches/${branchId}`).then(res => res.data.data),

  // Gallery / Media (ảnh thư viện + ẩm thực, global)
  getGalleryImages: (category) => axiosInstance.get('/admin/gallery', { params: { category } }).then(res => res.data.data),
  uploadGalleryImage: (formData) => axiosInstance.post('/admin/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data.data),
  updateGalleryImage: (id, data) => axiosInstance.put(`/admin/gallery/${id}`, data).then(res => res.data.data),
  deleteGalleryImage: (id) => axiosInstance.delete(`/admin/gallery/${id}`).then(res => res.data.data),
}

export default adminService


