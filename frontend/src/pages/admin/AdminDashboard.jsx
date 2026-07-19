import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import '../manager/manager.css'   // bộ page-shell .mgr-* dùng chung back-office
import './admin.css'

// Logo sen — đồng bộ với Manager/Reception sidebar
const LotusLogo = () => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 40, height: 35 }}>
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" opacity="0.85" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" opacity="0.85" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" opacity="0.65" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" opacity="0.65" />
  </svg>
)

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)

  // Auto open the reports menu if on any reports path
  const isReportPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/reports')
  const [reportsOpen, setReportsOpen] = useState(isReportPath)

  useEffect(() => {
    if (isReportPath) {
      setReportsOpen(true)
    }
  }, [location.pathname, isReportPath])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="admin-lotus"><LotusLogo /></span>
          <h2>HANOI HOTEL</h2>
          <p>Quản trị</p>
        </div>
        <nav className="admin-sidebar-menu">
          {/* Reports Collapsible Dropdown */}
          <div className={`admin-menu-dropdown ${reportsOpen ? 'open' : ''}`}>
            <div 
              className={`admin-menu-item dropdown-toggle ${isReportPath ? 'active' : ''}`}
              onClick={() => setReportsOpen(!reportsOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Báo cáo</span>
              <svg 
                className="dropdown-arrow" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                style={{ 
                  marginLeft: 'auto', 
                  width: '14px', 
                  height: '14px', 
                  transform: reportsOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.25s ease' 
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {reportsOpen && (
              <div className="admin-menu-submenu">
                <NavLink 
                  to="/admin" 
                  end 
                  className={({ isActive }) => `admin-submenu-item ${isActive ? 'active' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="submenu-icon">
                    <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                    <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                    <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                  </svg>
                  <span>Báo cáo chung</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/reports" 
                  className={({ isActive }) => `admin-submenu-item ${isActive || location.pathname.startsWith('/admin/reports') ? 'active' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="submenu-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <rect x="8" y="13" width="2" height="5" rx="0.5"></rect>
                    <rect x="11" y="11" width="2" height="7" rx="0.5"></rect>
                    <rect x="14" y="15" width="2" height="3" rx="0.5"></rect>
                  </svg>
                  <span>Báo cáo chi tiết</span>
                </NavLink>
              </div>
            )}
          </div>

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
            <span>Quản lý khách hàng</span>
          </NavLink>

          <NavLink
            to="/admin/gallery"
            className={({ isActive }) => `admin-menu-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Thư viện ảnh</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer - User Info & Logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span className="admin-user-name" title={user?.fullName || user?.email}>
              {user?.fullName || 'System Admin'}
            </span>
            <span className="admin-user-role-text">{user?.email || 'admin@hbms.vn'}</span>
          </div>
          <button className="admin-sidebar-logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, marginRight: 8 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <span className="admin-branch-badge">SYSTEM ADMIN</span>
          </div>
          <div className="admin-header-greeting">
            <span>Xin chào, <strong>{user?.fullName || user?.email || 'Admin'}</strong></span>
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
