// Sprint 0 — PRE-WIRED. Không sửa khung này; mỗi người thêm route con TRONG trang của mình
// (dùng nested route bên trong *Dashboard) để tránh đụng file.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ProtectedRoute from '../components/ProtectedRoute'
import { roleHome } from '../utils/roleHome'
import HomePage from '../pages/HomePage'
import RoomDetail from '../pages/RoomDetail'
import LoginPage from '../pages/auth/LoginPage'
import BookingPage from '../pages/BookingPage'
import BookingGroupCheckout from '../pages/BookingGroupCheckout'

// --- STATIC PAGES ---
import Dining from '../pages/Dining'
import Facilities from '../pages/Facilities'
import Gallery from '../pages/Gallery'
import Contact from '../pages/Contact'

import CustomerHome from '../pages/customer/CustomerHome'
import CustomerProfile from '../pages/customer/CustomerProfile'
import BookingHistoryPage from '../pages/customer/BookingHistoryPage'
import ReceptionDashboard from '../pages/reception/ReceptionDashboard'
import HousekeepingDashboard from '../pages/housekeeping/HousekeepingDashboard'
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'
import BranchManagement from '../pages/admin/BranchManagement'
import StaffManagement from '../pages/admin/StaffManagement'
import DashboardIndex from '../pages/admin/DashboardIndex'
import BranchDashboard from '../pages/admin/BranchDashboard'
import BranchStaff from '../pages/admin/BranchStaff'
import GalleryManagement from '../pages/admin/GalleryManagement'


// Route gốc: nhân viên đã đăng nhập -> dashboard theo role; customer/guest -> trang chủ.
// Giữ phiên sau khi tắt/mở lại trình duyệt (user+token đọc từ localStorage trong authSlice).
const RootRoute = () => {
  const { user, token } = useSelector((s) => s.auth)
  const home = token && user ? roleHome(user.role) : null
  return home ? <Navigate to={home} replace /> : <HomePage />
}

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public / Guest — Khánh */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/rooms" element={<CustomerHome />} />
      <Route path="/rooms/:id" element={<RoomDetail />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/checkout/group/:id" element={<BookingGroupCheckout />} />

      {/* Static Pages Routes */}
      <Route path="/dining" element={<Dining />} />
      {/* Giữ redirect cho link cũ (/dining/asian...) về trang Ẩm thực gộp */}
      <Route path="/dining/*" element={<Navigate to="/dining" replace />} />
      
      <Route path="/amenities" element={<Facilities />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/contact" element={<Contact />} />

      {/* Customer — Khánh */}
      <Route path="/customer/*" element={
        <ProtectedRoute allow={['customer']}>
          <Routes>
            <Route path="" element={<CustomerProfile />} />
            <Route path="booking-history" element={<BookingHistoryPage />} />
          </Routes>
        </ProtectedRoute>
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
        <Route path="branches/:branchId/staff" element={<BranchStaff />} />
        <Route path="reports" element={<BranchDashboard />} />
        <Route path="reports/:branchId" element={<BranchDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="gallery" element={<GalleryManagement />} />
        <Route index element={<DashboardIndex />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default AppRoutes
