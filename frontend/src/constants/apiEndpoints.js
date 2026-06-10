// Sprint 0 — PRE-WIRED khung 7 nhóm. Mỗi người điền endpoint TRONG nhóm của mình.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const ENDPOINTS = {
  AUTH: { // Sprint 0
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  PUBLIC: {},        // Khánh — Guest (UC-11→16)
  CUSTOMER: {},      // Khánh — Customer (UC-01→25)
  RECEPTION: {},     // Quốc  — Receptionist (UC-26→43)
  HOUSEKEEPING: {},  // Tú    — Housekeeper (UC-44→55)
  MANAGER: {},       // Hoàng — Branch Manager (UC-56→70)
  ADMIN: {},         // Sáng  — Super Admin (UC-71→82)
}
