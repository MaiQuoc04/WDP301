import axiosInstance from './axiosInstance'
import { ENDPOINTS } from '../constants'

export const authService = {
  login: (data) => axiosInstance.post(ENDPOINTS.AUTH.LOGIN, data),
  register: (data) => axiosInstance.post(ENDPOINTS.AUTH.REGISTER, data),
  logout: () => axiosInstance.post(ENDPOINTS.AUTH.LOGOUT),
  verifyOtp: (data) => axiosInstance.post(ENDPOINTS.AUTH.VERIFY_OTP, data),
  forgotPassword: (data) => axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data),
  resetPassword: (data) => axiosInstance.post(ENDPOINTS.AUTH.RESET_PASSWORD, data),
}
