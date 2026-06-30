// Owner: Quốc — Receptionist (UC-26→43). Layout sidebar đồng bộ với Manager/Housekeeping.
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import {
  DashboardOutlined,
  BookOutlined,
  UserAddOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  CoffeeOutlined,
  TransactionOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import ReceptionDashboardPage from './ReceptionDashboardPage'
import BookingsPage from './BookingsPage'
import BookingDetailPage from './BookingDetailPage'
import GroupDetailPage from './GroupDetailPage'
import WalkInPage from './WalkInPage'
import RoomsPage from './RoomsPage'
import SchedulePage from './SchedulePage'
import ServiceBoardPage from './ServiceBoardPage'
import TransactionsPage from './TransactionsPage'
import NotificationBell from '../../components/NotificationBell'
import NotificationsPage from '../../components/NotificationsPage'
import '../manager/manager.css'
import './reception.css'

const LotusLogo = () => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" opacity="0.85" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" opacity="0.85" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" opacity="0.65" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" opacity="0.65" />
  </svg>
)

export default function ReceptionDashboard() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const handleLogout = () => { dispatch(logout()); nav('/login') }

  return (
    <div className="manager-layout">
      <aside className="manager-sidebar">
        <div className="manager-brand">
          <LotusLogo />
          <h2>HANOI HOTEL</h2>
          <span>Reception</span>
        </div>

        <nav className="manager-nav">
          <NavLink to="/reception" end className="manager-nav-item"><DashboardOutlined /><span>Tổng quan</span></NavLink>
          <NavLink to="/reception/bookings" className="manager-nav-item"><BookOutlined /><span>Bookings</span></NavLink>
          <NavLink to="/reception/walk-in" className="manager-nav-item"><UserAddOutlined /><span>Walk-in</span></NavLink>
          <NavLink to="/reception/rooms" className="manager-nav-item"><AppstoreOutlined /><span>Phòng</span></NavLink>
          <NavLink to="/reception/schedule" className="manager-nav-item"><CalendarOutlined /><span>Lịch</span></NavLink>
          <NavLink to="/reception/services" className="manager-nav-item"><CoffeeOutlined /><span>Dịch vụ</span></NavLink>
          <NavLink to="/reception/transactions" className="manager-nav-item"><TransactionOutlined /><span>Giao dịch</span></NavLink>
        </nav>

        <div className="manager-sidebar-footer">
          <div className="manager-user-info">
            <span className="manager-user-name" title={user?.fullName || user?.email}>{user?.fullName || 'Lễ tân'}</span>
            <span className="manager-user-role">{user?.email}</span>
          </div>
          <button className="manager-logout-btn" onClick={handleLogout}>
            <LogoutOutlined style={{ marginRight: 8 }} /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="manager-container">
        <header className="manager-header">
          <div className="manager-title-area">
            <span className="manager-branch-badge">HBMS · LỄ TÂN</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <NotificationBell basePath="/reception" />
            <span style={{ fontSize: 14, color: 'var(--color-light-gray)' }}>
              Xin chào, <strong>{user?.fullName || user?.email}</strong>
            </span>
          </div>
        </header>

        <main className="rc-main">
          <Routes>
            <Route index element={<ReceptionDashboardPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="booking-groups/:id" element={<GroupDetailPage />} />
            <Route path="walk-in" element={<WalkInPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="services" element={<ServiceBoardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="notifications" element={<NotificationsPage basePath="/reception" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
