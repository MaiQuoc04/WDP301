import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import './admin.css'

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <h2>Hanoi Hotel</h2>
          <p>Management</p>
        </div>
        <nav className="admin-sidebar-menu">
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => `admin-menu-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Báo cáo hệ thống</span>
          </NavLink>

          <NavLink 
            to="/admin/branches" 
            className={({ isActive }) => `admin-menu-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18"></path>
              <path d="M9 8h1a2 2 0 0 1 2 2v12"></path>
              <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
            </svg>
            <span>Quản lý chi nhánh</span>
          </NavLink>

          <NavLink 
            to="/admin/staff" 
            className={({ isActive }) => `admin-menu-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Quản lý tài khoản</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <h1>Hệ thống quản trị HBMS</h1>
          </div>
          <div className="admin-header-profile">
            <div className="admin-profile-info">
              <div className="admin-avatar">SA</div>
              <div className="admin-profile-text">
                <div className="admin-profile-name">Super Admin</div>
                <div className="admin-profile-role">Hệ thống HBMS</div>
              </div>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              Đăng xuất
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
