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
import BranchManagement from '../pages/admin/BranchManagement'
import StaffManagement from '../pages/admin/StaffManagement'
import DashboardIndex from '../pages/admin/DashboardIndex'
import BranchDashboard from '../pages/admin/BranchDashboard'


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
      }>
        <Route path="branches" element={<BranchManagement />} />
        <Route path="branches/:branchId/dashboard" element={<BranchDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route index element={<DashboardIndex />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default AppRoutes
