// Sprint 0 — PRE-WIRED. Không sửa khung này; mỗi người thêm route con TRONG trang của mình
// (dùng nested route bên trong *Dashboard) để tránh đụng file.
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/auth/LoginPage'
import CustomerHome from '../pages/customer/CustomerHome'
import ReceptionDashboard from '../pages/reception/ReceptionDashboard'
import HousekeepingDashboard from '../pages/housekeeping/HousekeepingDashboard'
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public / Guest — Khánh */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Customer — Khánh */}
      <Route path="/customer/*" element={
        <ProtectedRoute allow={['customer']}><CustomerHome /></ProtectedRoute>
      } />

      {/* Reception — Quốc */}
      <Route path="/reception/*" element={
        <ProtectedRoute allow={['receptionist']}><ReceptionDashboard /></ProtectedRoute>
      } />

      {/* Housekeeping — Tú */}
      <Route path="/housekeeping/*" element={
        <ProtectedRoute allow={['housekeeper']}><HousekeepingDashboard /></ProtectedRoute>
      } />

      {/* Manager — Hoàng */}
      <Route path="/manager/*" element={
        <ProtectedRoute allow={['branch_manager']}><ManagerDashboard /></ProtectedRoute>
      } />

      {/* Admin — Sáng */}
      <Route path="/admin/*" element={
        <ProtectedRoute allow={['super_admin']}><AdminDashboard /></ProtectedRoute>
      } />
    </Routes>
  </BrowserRouter>
)

export default AppRoutes
