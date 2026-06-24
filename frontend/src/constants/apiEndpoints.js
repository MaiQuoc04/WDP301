// Sprint 0 — PRE-WIRED khung 7 nhóm. Mỗi người điền endpoint TRONG nhóm của mình.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const ENDPOINTS = {
  AUTH: { // Sprint 0
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  PUBLIC: {},        // Khánh — Guest (UC-11→16)
  CUSTOMER: {},      // Khánh — Customer (UC-01→25)
  RECEPTION: {},     // Quốc  — Receptionist (UC-26→43)
  HOUSEKEEPING: {},  // Tú    — Housekeeper (UC-44→55)
  MANAGER: {
    ROOM_TYPES: '/manager/room-types',
    ROOM_TYPE_OPTIONS: '/manager/room-types/options',
    ROOMS: '/manager/rooms',
    ROOM_PRICES: '/manager/room-prices',
    AMENITIES: '/manager/amenities',
    AMENITY_OPTIONS: '/manager/amenities/options',
    SERVICES: '/manager/services',
    SERVICE_OPTIONS: '/manager/services/options',
    ROOM_ISSUES: '/manager/room-issues',
    HOUSEKEEPING_TASKS: '/manager/housekeeping/tasks',
    HOUSEKEEPERS: '/manager/housekeepers',
    RESTOCK_ROOMS: '/manager/restock/rooms',
  },
  ADMIN: {},         // Sáng  — Super Admin (UC-71→82)
}
