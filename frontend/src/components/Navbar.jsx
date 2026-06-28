import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout as logoutAction } from '../redux/slices/authSlice'
import { customerService } from '../services'

/* ---------- Lotus SVG Icon ---------- */
const LotusIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" opacity="0.85" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" opacity="0.85" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" opacity="0.65" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" opacity="0.65" />
    <path d="M18 44C22 48 27 50 32 50C37 50 42 48 46 44" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
)

/* ---------- Navigation Data ---------- */
const defaultNavItems = [
  { label: 'TRANG CHỦ', href: '/', active: true },
  { label: 'HẠNG PHÒNG', href: '/rooms', dropdown: [] },
  { label: 'ẨM THỰC', href: '/dining' },
  { label: 'TIỆN NGHI', href: '/amenities' },
  { label: 'THƯ VIỆN', href: '/gallery' },
  { label: 'LIÊN HỆ', href: '/contact' },
]

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { user } = useSelector((state) => state.auth)

  const [navItems, setNavItems] = useState(defaultNavItems)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [heroMode, setHeroMode] = useState(false)

  const isActive = (item) => {
    if (item.href === '/') return currentPath === '/'
    if (item.label === 'HẠNG PHÒNG') {
      return currentPath.startsWith('/rooms')
    }
    if (item.href === '/dining') return currentPath.startsWith('/dining')
    return currentPath.startsWith(item.href)
  }

  // Phát hiện trang có hero (nav trong suốt phủ lên hero); trang khác -> nav đặc + spacer.
  useEffect(() => {
    const check = () => setHeroMode(!!document.querySelector('.hero, [data-page-hero]'))
    check()
    const t = setTimeout(check, 60) // chờ hero mount xong
    return () => clearTimeout(t)
  }, [currentPath])

  // Đổi trạng thái nav khi cuộn
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Khoá cuộn nền khi mở menu mobile
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await customerService.getPublicRooms()
        if (res.success && res.data) {
          const roomsData = Array.isArray(res.data) ? res.data : (res.data.rooms || [])
          const roomDropdown = roomsData.map((room) => ({ label: room.name, href: `/rooms/${room._id}` }))
          setNavItems((prev) => prev.map((item) => (item.label === 'HẠNG PHÒNG' ? { ...item, dropdown: roomDropdown } : item)))
        }
      } catch (err) {
        console.error('Navbar fetch rooms error:', err)
      }
    }
    fetchRooms()
  }, [])

  const toggleMobile = () => {
    setMobileOpen((prev) => !prev)
    if (!mobileOpen) setMobileExpanded(null)
  }

  const handleLoginClick = (e) => {
    e.preventDefault()
    setMobileOpen(false)
    navigate('/login')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    dispatch(logoutAction())
    setMobileOpen(false)
    navigate('/')
  }

  // Nav trong suốt khi ở đầu trang hero và chưa cuộn
  const transparent = heroMode && !scrolled && !mobileOpen
  const initials = user
    ? (user.fullName ? user.fullName.split(' ').pop().substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase())
    : ''

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          transparent
            ? 'bg-transparent'
            : 'bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.06)] border-b border-black/5'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-container items-center justify-between gap-4 px-5 lg:px-10">
          {/* Logo */}
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Hanoi Hotel - Trang chủ">
            <LotusIcon className="h-8 w-8 text-gold" />
            <span className="font-display text-2xl font-semibold tracking-wide text-gold">Hanoi Hotel</span>
          </a>

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-1 xl:flex">
            {navItems.map((item, index) => (
              <li
                key={index}
                className="relative"
                onMouseEnter={() => item.dropdown && setActiveDropdown(index)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={item.href}
                  className={`group relative flex items-center gap-1 px-3 py-2 font-nav text-[12.5px] font-medium tracking-wide transition-colors ${
                    transparent ? 'text-white/90 hover:text-white' : 'text-charcoal/80 hover:text-gold'
                  } ${isActive(item) ? (transparent ? '!text-white' : '!text-gold') : ''}`}
                >
                  {item.label}
                  {item.dropdown && <span className="text-[8px] opacity-70">▾</span>}
                  <span
                    className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-300 ${
                      isActive(item) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    } ${transparent ? 'bg-white' : 'bg-gold'}`}
                  />
                </a>

                {item.dropdown && activeDropdown === index && item.dropdown.length > 0 && (
                  <ul className="absolute left-0 top-full min-w-[220px] rounded-md border border-black/5 bg-white py-2 shadow-elevated animate-fade-in">
                    {item.dropdown.map((sub, subIndex) => (
                      <li key={subIndex}>
                        <a
                          href={sub.href}
                          className="block px-5 py-2.5 font-body text-sm text-charcoal/80 transition-colors hover:bg-cream hover:text-gold"
                        >
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
          <div className="hidden shrink-0 items-center gap-3 xl:flex">
            {!user ? (
              <a
                href="/login"
                onClick={handleLoginClick}
                className="rounded-sm border border-gold bg-gold px-6 py-2.5 font-nav text-[12.5px] font-semibold tracking-wide text-white shadow-md transition-colors hover:bg-gold-hover hover:border-gold-hover"
              >
                Đăng nhập
              </a>
            ) : (
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('profile')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-2" aria-label="User profile">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-semibold text-white shadow-raised">
                    {initials}
                  </span>
                  <span className={`text-[8px] ${transparent ? 'text-white' : 'text-charcoal'}`}>▾</span>
                </button>

                {activeDropdown === 'profile' && (
                  <div className="absolute right-0 top-full w-64 overflow-hidden rounded-md border border-black/5 bg-white shadow-elevated animate-fade-in">
                    <div className="bg-cream px-5 py-4">
                      <p className="font-display text-lg font-semibold text-charcoal">{user.fullName || 'Người dùng'}</p>
                      <p className="truncate text-sm text-charcoal/60">{user.email}</p>
                    </div>
                    <ul className="py-1.5">
                      <li>
                        <a href="/customer" className="flex items-center gap-3 px-5 py-2.5 text-sm text-charcoal/80 transition-colors hover:bg-cream hover:text-gold">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z"/></svg>
                          Tài khoản của tôi
                        </a>
                      </li>
                      <li>
                        <a href="/customer/booking-history" className="flex items-center gap-3 px-5 py-2.5 text-sm text-charcoal/80 transition-colors hover:bg-cream hover:text-gold">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                          Lịch sử đặt phòng
                        </a>
                      </li>
                      <li>
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
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
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 xl:hidden"
            onClick={toggleMobile}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span className={`h-0.5 w-6 origin-center transition-all duration-300 ${transparent ? 'bg-white' : 'bg-charcoal'} ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-0.5 w-6 transition-all duration-300 ${transparent ? 'bg-white' : 'bg-charcoal'} ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-6 origin-center transition-all duration-300 ${transparent ? 'bg-white' : 'bg-charcoal'} ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`overflow-hidden bg-white transition-[max-height] duration-500 xl:hidden ${mobileOpen ? 'max-h-[85vh] overflow-y-auto border-t border-black/5' : 'max-h-0'}`}>
          {user && (
            <div className="flex items-center gap-3 bg-cream px-5 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-sm font-semibold text-white">{initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-charcoal">{user.fullName || 'Người dùng'}</p>
                <p className="truncate text-sm text-charcoal/60">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="rounded-sm border border-gold px-3 py-1.5 text-xs font-semibold text-gold">Đăng xuất</button>
            </div>
          )}

          <ul className="px-3 py-2">
            {navItems.map((item, index) => (
              <li key={index} className="border-b border-black/5 last:border-0">
                <a
                  href={item.dropdown && item.dropdown.length > 0 ? undefined : item.href}
                  className={`flex items-center justify-between px-2 py-3.5 font-nav text-sm font-medium tracking-wide ${isActive(item) ? 'text-gold' : 'text-charcoal/80'}`}
                  onClick={(e) => {
                    if (item.dropdown && item.dropdown.length > 0) {
                      e.preventDefault()
                      setMobileExpanded(mobileExpanded === index ? null : index)
                    } else {
                      setMobileOpen(false)
                    }
                  }}
                >
                  {item.label}
                  {item.dropdown && item.dropdown.length > 0 && (
                    <span className={`text-[10px] transition-transform ${mobileExpanded === index ? 'rotate-180' : ''}`}>▾</span>
                  )}
                </a>

                {item.dropdown && item.dropdown.length > 0 && mobileExpanded === index && (
                  <ul className="bg-cream/60 pb-2">
                    {item.dropdown.map((sub, subIndex) => (
                      <li key={subIndex}>
                        <a href={sub.href} onClick={() => setMobileOpen(false)} className="block px-6 py-2.5 text-sm text-charcoal/70 hover:text-gold">
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
            <div className="px-5 pb-6 pt-2">
              <a href="/login" onClick={handleLoginClick} className="block rounded-sm bg-gold px-6 py-3 text-center font-nav text-sm font-semibold tracking-wide text-white">
                Đăng nhập
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer cho trang KHÔNG có hero (nav đặc không phủ lên nội dung) */}
      {!heroMode && <div className="h-20" aria-hidden="true" />}
    </>
  )
}

export default Navbar
