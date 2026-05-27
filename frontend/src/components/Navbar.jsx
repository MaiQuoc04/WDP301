import { useState } from 'react'
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
const navItems = [
  { label: 'TRANG CHỦ', href: '/', active: true },
  {
    label: 'HẠNG PHÒNG',
    href: '/rooms',
    dropdown: [
      { label: 'Phòng Deluxe', href: '/rooms/deluxe' },
      { label: 'Phòng Executive Suite', href: '/rooms/executive' },
      { label: 'Phòng Presidential Suite', href: '/rooms/presidential' },
      { label: 'Phòng Gia Đình', href: '/rooms/family' },
    ],
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
    href: '/amenities',
    dropdown: [
      { label: 'Hồ Bơi Vô Cực', href: '/amenities/pool' },
      { label: 'Spa & Wellness', href: '/amenities/spa' },
      { label: 'Phòng Gym', href: '/amenities/gym' },
    ],
  },
  { label: 'HỌP & SỰ KIỆN', href: '/events' },
  { label: 'THƯ VIỆN', href: '/gallery' },
  { label: 'LIÊN HỆ', href: '/contact' },
]

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)

  const toggleMobile = () => {
    setMobileOpen((prev) => !prev)
    if (mobileOpen) setMobileExpanded(null)
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
                className={`navbar__link ${item.active ? 'navbar__link--active' : ''}`}
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

        {/* Desktop CTA */}
        <a href="/booking" className="navbar__cta">
          ĐẶT PHÒNG
        </a>

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
        <ul className="navbar__mobile-list">
          {navItems.map((item, index) => (
            <li key={index} className="navbar__mobile-item">
              <a
                href={item.dropdown ? undefined : item.href}
                className={`navbar__mobile-link ${item.active ? 'navbar__mobile-link--active' : ''}`}
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

        <a href="/booking" className="navbar__mobile-cta">
          ĐẶT PHÒNG
        </a>
      </div>
    </nav>
  )
}

export default Navbar
