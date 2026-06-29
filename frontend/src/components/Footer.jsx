const LotusLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" />
  </svg>
)

const exploreLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Liên hệ', href: '/contact' },
  { label: 'Loại phòng', href: '/rooms' },
  { label: 'Thư viện', href: '/gallery' },
  { label: 'Ẩm thực', href: '/dining' },
  { label: 'Tiện nghi', href: '/amenities' },
]

const contacts = [
  { icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', text: 'D8 Giảng Võ, Phường Giảng Võ, Hà Nội' },
  { icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.25-3.95-6.847-6.847l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z', text: '(+84) 24 3845 2270' },
  { icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6-9.75-6', text: 'sales@hanoihotel.com.vn' },
]

const socials = [
  { label: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
  { label: 'Instagram', icon: 'M16 2H8a6 6 0 00-6 6v8a6 6 0 006 6h8a6 6 0 006-6V8a6 6 0 00-6-6zm-4 5.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM17.5 6a1 1 0 110 2 1 1 0 010-2z' },
  { label: 'YouTube', icon: 'M22 8.5a3 3 0 00-2.1-2.1C18 6 12 6 12 6s-6 0-7.9.4A3 3 0 002 8.5 31 31 0 002 12a31 31 0 00.1 3.5 3 3 0 002.1 2.1C6 18 12 18 12 18s6 0 7.9-.4a3 3 0 002.1-2.1A31 31 0 0022 12a31 31 0 00-.1-3.5zM10 15V9l5 3-5 3z' },
]

const Footer = () => {
  return (
    <footer className="bg-charcoal text-white/70">
      <div className="container mx-auto px-5 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <LotusLogo className="h-10 w-10 text-gold" />
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-wide text-white">HANOI HOTEL</h3>
                <p className="font-nav text-[11px] uppercase tracking-luxe text-gold-light">Live Oriental Heritage</p>
              </div>
            </div>
            <p className="mt-6 max-w-xs font-body text-sm leading-relaxed text-white/55">
              Khách sạn Quốc tế đầu tiên tại Hà Nội với 218 phòng nghỉ sang trọng bên Hồ Giảng Võ thanh bình.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 hover:border-gold hover:bg-gold hover:text-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d={s.icon} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h4 className="font-nav text-xs font-semibold uppercase tracking-luxe text-white">Khám Phá</h4>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
              {exploreLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="font-body text-sm text-white/60 transition-colors hover:text-gold-light">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Địa chỉ */}
          <div>
            <h4 className="font-nav text-xs font-semibold uppercase tracking-luxe text-white">Liên Hệ</h4>
            <ul className="mt-5 space-y-4">
              {contacts.map((c, i) => (
                <li key={i} className="flex items-start gap-3 font-body text-sm text-white/60">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-gold-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={c.icon} /></svg>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center md:flex-row md:text-left">
          <p className="font-body text-xs text-white/45">© 2024 HANOI HOTEL. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/dieu-khoan" className="font-body text-xs text-white/45 transition-colors hover:text-gold-light">Điều khoản</a>
            <a href="/bao-mat" className="font-body text-xs text-white/45 transition-colors hover:text-gold-light">Chính sách Bảo mật & Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
