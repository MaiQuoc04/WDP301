import axios from 'axios'
import { API_BASE_URL } from '../constants'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Khoá tài khoản / chi nhánh -> xoá phiên + về màn đăng nhập kèm lý do (code do BE gửi).
      const code = err.response?.data?.code
      const reason = code === 'ACCOUNT_LOCKED' ? 'account' : code === 'BRANCH_LOCKED' ? 'branch' : ''
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = reason ? `/login?locked=${reason}` : '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
