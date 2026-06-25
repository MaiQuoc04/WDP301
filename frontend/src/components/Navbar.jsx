import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout as logoutAction } from '../redux/slices/authSlice'
import { customerService } from '../services'
import './Navbar.css'

/* ---------- Lotus SVG Icon ---------- */
const LotusIcon = () => (
  <svg className="navbar__logo-icon" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center petal */}
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="#A18348" />
    {/* Inner left */}
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="#A18348" opacity="0.85" />
    {/* Inner right */}
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="#A18348" opacity="0.85" />
    {/* Outer left */}
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="#A18348" opacity="0.65" />
    {/* Outer right */}
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="#A18348" opacity="0.65" />
    {/* Base curve */}
    <path d="M18 44C22 48 27 50 32 50C37 50 42 48 46 44" stroke="#A18348" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
)

/* ---------- Navigation Data ---------- */
const defaultNavItems = [
  { label: 'TRANG CHỦ', href: '/', active: true },
  {
    label: 'HẠNG PHÒNG',
    href: '/rooms', // Trỏ đến trang danh sách phòng
    dropdown: [], // Sẽ được điền từ DB
  },
  {
    label: 'ẨM THỰC',
    href: '/dining',
    dropdown: [
      { label: 'Nhà Hàng Á Đông', href: '/dining/asian' },
      { label: 'Nhà Hàng Phương Tây', href: '/dining/western' },
      { label: 'Quầy Bar & Lounge', href: '/dining/bar' },
    ],
  },
  { label: 'ƯU ĐÃI', href: '/offers' },
  {
    label: 'TIỆN NGHI',
    href: '/amenities'
  },
  { label: 'HỌP & SỰ KIỆN', href: '/events' },
  { label: 'THƯ VIỆN', href: '/gallery' },
  { label: 'LIÊN HỆ', href: '/contact' },
]

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { user } = useSelector((state) => state.auth)

  const isActive = (item) => {
    if (item.href === '/') return currentPath === '/';
    if (item.label === 'HẠNG PHÒNG') {
      return currentPath.startsWith('/customer') || currentPath.startsWith('/rooms');
    }
    if (item.href === '/dining') {
      return currentPath.startsWith('/dining');
    }
    return currentPath.startsWith(item.href);
  };

  const [navItems, setNavItems] = useState(defaultNavItems)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await customerService.getPublicRooms()
        if (res.success && res.data) {
          const roomsData = Array.isArray(res.data) ? res.data : (res.data.rooms || [])
          const roomDropdown = roomsData.map(room => ({
            label: room.name,
            href: `/rooms/${room._id}`
          }))
          setNavItems(prev => prev.map(item => 
            item.label === 'HẠNG PHÒNG' ? { ...item, dropdown: roomDropdown } : item
          ))
        }
      } catch (err) {
        console.error('Navbar fetch rooms error:', err)
      }
    }
    fetchRooms()
  }, [])

  const toggleMobile = () => {
    setMobileOpen((prev) => !prev)
    if (!mobileOpen) setMobileExpanded(null) // fixed bug logic
  }

  const handleLoginClick = (e) => {
    e.preventDefault()
    navigate('/login')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    dispatch(logoutAction())
    navigate('/')
  }

  return (
    <nav className="navbar" id="main-nav">
      <div className="navbar__inner">
        {/* Logo */}
        <a href="/" className="navbar__logo" aria-label="Hanoi Hotel - Trang chủ">
          <LotusIcon />
          <span className="navbar__logo-text">Hanoi Hotel</span>
        </a>

        {/* Desktop Navigation */}
        <ul className="navbar__menu">
          {navItems.map((item, index) => (
            <li
              key={index}
              className="navbar__item"
              onMouseEnter={() => item.dropdown && setActiveDropdown(index)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href={item.href}
                className={`navbar__link ${isActive(item) ? 'navbar__link--active' : ''}`}
              >
                {item.label}
                {item.dropdown && <span className="navbar__arrow">▾</span>}
              </a>

              {item.dropdown && activeDropdown === index && (
                <ul className="navbar__dropdown">
                  {item.dropdown.map((sub, subIndex) => (
                    <li key={subIndex}>
                      <a href={sub.href} className="navbar__dropdown-link">
                        {sub.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* Desktop CTA & Actions */}
        <div className="navbar__actions">
          {!user ? (
            <a href="/login" onClick={handleLoginClick} className="navbar__cta">
              Đăng nhập
            </a>
          ) : (
            <div 
              className="navbar__profile"
              onMouseEnter={() => setActiveDropdown('profile')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="navbar__avatar-btn" aria-label="User profile">
                <div className="navbar__avatar">
                  {user.fullName ? user.fullName.split(' ').pop().substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                </div>
                <span className="navbar__avatar-arrow">▾</span>
              </button>

              {activeDropdown === 'profile' && (
                <div className="navbar__profile-dropdown">
                  <div className="navbar__profile-header">
                    <span className="navbar__profile-name">{user.fullName || 'Người dùng'}</span>
                    <span className="navbar__profile-email">{user.email}</span>
                    {/* <span className="navbar__profile-role">{user.role === 'customer' ? 'Khách hàng' : 'Nhân viên'}</span> */}
                  </div>
                  <div className="navbar__profile-divider"></div>
                  <ul className="navbar__profile-links">
                    <li>
                      <a href="/customer" className="navbar__profile-link-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z"/></svg>
                        Tài khoản của tôi
                      </a>
                    </li>
                    <li>
                      <a href="/customer/booking-history" className="navbar__profile-link-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                        Lịch sử đặt phòng
                      </a>
                    </li>
                    <li>
                      <button onClick={handleLogout} className="navbar__profile-link-item navbar__profile-logout">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Đăng xuất
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={toggleMobile}
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar__mobile-menu ${mobileOpen ? 'navbar__mobile-menu--open' : ''}`}>
        {user && (
          <div className="navbar__mobile-user">
            <div className="navbar__mobile-avatar">
              {user.fullName ? user.fullName.split(' ').pop().substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="navbar__mobile-user-info">
              <span className="navbar__mobile-user-name">{user.fullName || 'Người dùng'}</span>
              <span className="navbar__mobile-user-email">{user.email}</span>
            </div>
            <button onClick={handleLogout} className="navbar__mobile-logout-btn">
              Đăng xuất
            </button>
          </div>
        )}

        <ul className="navbar__mobile-list" style={{ marginTop: '16px' }}>
          {navItems.map((item, index) => (
            <li key={index} className="navbar__mobile-item">
              <a
                href={item.dropdown ? undefined : item.href}
                className={`navbar__mobile-link ${isActive(item) ? 'navbar__mobile-link--active' : ''}`}
                onClick={(e) => {
                  if (item.dropdown) {
                    e.preventDefault()
                    setMobileExpanded(mobileExpanded === index ? null : index)
                  }
                }}
              >
                {item.label}
                {item.dropdown && (
                  <span style={{ float: 'right', transition: 'transform 0.2s', transform: mobileExpanded === index ? 'rotate(180deg)' : 'none' }}>
                    ▾
                  </span>
                )}
              </a>

              {item.dropdown && mobileExpanded === index && (
                <ul className="navbar__mobile-sub">
                  {item.dropdown.map((sub, subIndex) => (
                    <li key={subIndex}>
                      <a href={sub.href} className="navbar__mobile-sub-link">
                        {sub.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {!user && (
          <a href="/login" onClick={handleLoginClick} className="navbar__mobile-cta">
            Đăng nhập
          </a>
        )}
      </div>
    </nav>
  )
}

export default Navbar
