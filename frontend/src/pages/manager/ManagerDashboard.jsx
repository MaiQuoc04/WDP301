import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import DashboardOverview from './DashboardOverview'
import RoomTypesPage from './RoomTypesPage'
import RoomPricesPage from './RoomPricesPage'
import RoomsPage from './RoomsPage'
import AmenitiesPage from './AmenitiesPage'
import ServicesPage from './ServicesPage'
import HousekeepingPage from './HousekeepingPage'
import RoomIssuesPage from './RoomIssuesPage'
import RestockPage from './RestockPage'
import HousekeeperFloorsPage from './HousekeeperFloorsPage'
import NotificationBell from '../../components/NotificationBell'
import NotificationsPage from '../../components/NotificationsPage'
import './manager.css'

import {
  DashboardOutlined,
  AppstoreOutlined,
  DollarOutlined,
  HomeOutlined,
  CoffeeOutlined,
  CustomerServiceOutlined,
  AuditOutlined,
  ApartmentOutlined,
  WarningOutlined,
  InboxOutlined,
  LogoutOutlined
} from '@ant-design/icons'

const LotusLogo = () => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 40, height: 35 }}>
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" opacity="0.85" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" opacity="0.85" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" opacity="0.65" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" opacity="0.65" />
  </svg>
)

export default function ManagerDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="manager-layout">
      {/* Sidebar Section */}
      <aside className="manager-sidebar">
        <div className="manager-brand">
          <LotusLogo />
          <h2>HANOI HOTEL</h2>
          <span>Branch Manager</span>
        </div>

        <nav className="manager-nav">
          <NavLink to="/manager" end className="manager-nav-item">
            <DashboardOutlined />
            <span>Tổng quan</span>
          </NavLink>
          <NavLink to="/manager/room-types" className="manager-nav-item">
            <AppstoreOutlined />
            <span>Loại phòng</span>
          </NavLink>
          <NavLink to="/manager/room-prices" className="manager-nav-item">
            <DollarOutlined />
            <span>Cấu hình giá</span>
          </NavLink>
          <NavLink to="/manager/rooms" className="manager-nav-item">
            <HomeOutlined />
            <span>Phòng vật lý</span>
          </NavLink>
          <NavLink to="/manager/amenities" className="manager-nav-item">
            <CoffeeOutlined />
            <span>Tiện nghi phòng</span>
          </NavLink>
          <NavLink to="/manager/services" className="manager-nav-item">
            <CustomerServiceOutlined />
            <span>Dịch vụ</span>
          </NavLink>
          <NavLink to="/manager/housekeeping" className="manager-nav-item">
            <AuditOutlined />
            <span>Dọn phòng</span>
          </NavLink>
          <NavLink to="/manager/restock" className="manager-nav-item">
            <InboxOutlined />
            <span>Bổ sung thiết bị</span>
          </NavLink>
          <NavLink to="/manager/floors" className="manager-nav-item">
            <ApartmentOutlined />
            <span>Phân tầng</span>
          </NavLink>
          <NavLink to="/manager/issues" className="manager-nav-item">
            <WarningOutlined />
            <span>Báo cáo sự cố</span>
          </NavLink>
        </nav>

        <div className="manager-sidebar-footer">
          <div className="manager-user-info">
            <span className="manager-user-name" title={user?.fullName || user?.email}>
              {user?.fullName || 'Manager'}
            </span>
            <span className="manager-user-role">{user?.email}</span>
          </div>
          <button className="manager-logout-btn" onClick={handleLogout}>
            <LogoutOutlined style={{ marginRight: 8 }} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="manager-container">
        <header className="manager-header">
          <div className="manager-title-area">
            {/* Page title gets computed by context or sub-route inside content */}
            <span className="manager-branch-badge">HANOI HOTEL HN01</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <NotificationBell basePath="/manager" />
            <span style={{ fontSize: 14, color: 'var(--color-light-gray)' }}>
              Xin chào, <strong>{user?.fullName || user?.email}</strong>
            </span>
          </div>
        </header>

        <main className="manager-content">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="room-types" element={<RoomTypesPage />} />
            <Route path="room-prices" element={<RoomPricesPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="amenities" element={<AmenitiesPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="housekeeping" element={<HousekeepingPage />} />
            <Route path="restock" element={<RestockPage />} />
            <Route path="floors" element={<HousekeeperFloorsPage />} />
            <Route path="notifications" element={<NotificationsPage basePath="/manager" />} />
            <Route path="issues" element={<RoomIssuesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
