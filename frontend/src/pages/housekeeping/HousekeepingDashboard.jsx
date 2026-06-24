import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import TasksPage from './TasksPage'
import TaskDetailPage from './TaskDetailPage'
import HistoryPage from './HistoryPage'
import NotificationBell from '../../components/NotificationBell'
import NotificationsPage from '../../components/NotificationsPage'
import '../manager/manager.css'
import './housekeeping.css'
import {
  AuditOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const LotusLogo = () => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" opacity="0.85" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" opacity="0.85" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" opacity="0.65" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" opacity="0.65" />
  </svg>
)

export default function HousekeepingDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="manager-layout hk-dashboard-layout">
      <aside className="manager-sidebar">
        <div className="manager-brand">
          <LotusLogo />
          <h2>HANOI HOTEL</h2>
          <span>Housekeeping</span>
        </div>

        <nav className="manager-nav">
          <NavLink to="/housekeeping" end className="manager-nav-item">
            <CheckSquareOutlined />
            <span>Task đang mở</span>
          </NavLink>
          <NavLink to="/housekeeping/history" className="manager-nav-item">
            <HistoryOutlined />
            <span>Lịch sử</span>
          </NavLink>
        </nav>

        <div className="manager-sidebar-footer">
          <div className="manager-user-info">
            <span className="manager-user-name" title={user?.fullName || user?.email}>
              {user?.fullName || 'Housekeeper'}
            </span>
            <span className="manager-user-role">{user?.email}</span>
          </div>
          <button className="manager-logout-btn" onClick={handleLogout}>
            <LogoutOutlined style={{ marginRight: 8 }} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="manager-container">
        <header className="manager-header">
          <div className="manager-title-area">
            <span className="manager-branch-badge">HOUSEKEEPING</span>
          </div>
          <div className="hk-header-user">
            <NotificationBell basePath="/housekeeping" />
            <AuditOutlined />
            <span>
              Xin chào, <strong>{user?.fullName || user?.email}</strong>
            </span>
          </div>
        </header>

        <main className="manager-content hk-main">
          <Routes>
            <Route index element={<TasksPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="notifications" element={<NotificationsPage basePath="/housekeeping" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
