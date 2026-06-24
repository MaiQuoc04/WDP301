import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import './admin.css'

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

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
          <h2>HANOI HOTEL</h2>
          <p>System Admin</p>
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
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <h1>Tổng Quản Trị Hệ Thống</h1>
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
