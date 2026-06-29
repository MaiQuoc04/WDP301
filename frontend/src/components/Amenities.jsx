import Reveal from './common/Reveal'

const amenities = [
  { label: 'Hồ bơi', icon: 'M3 12c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M3 17c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M8 9V4l8 3v0' },
  { label: 'Spa & Massage', icon: 'M12 2a7 7 0 00-7 7c0 3 2 5 4 6m3-13a7 7 0 017 7c0 3-2 5-4 6M12 8v13' },
  { label: 'Phòng Gym', icon: 'M6.5 6.5L17.5 17.5M3 9v6M21 9v6M6 7v10M18 7v10' },
  { label: 'Nhà hàng', icon: 'M3 3v7a3 3 0 003 3v8M6 3v7m3-7v7M16 3c-1 2-1 5-1 7a2 2 0 002 2v9' },
  { label: 'Sự kiện', icon: 'M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
  { label: 'Đưa đón sân bay', icon: 'M3 12l18-7-7 18-2-7-7-2-2-2z' },
]

const Amenities = () => {
  return (
    <section className="bg-off-white py-20 md:py-28">
      <div className="container mx-auto grid items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-10">
        {/* Hình ảnh */}
        <Reveal className="relative order-2 lg:order-1">
          <div className="overflow-hidden rounded-lg shadow-elevated">
            <img
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80"
              alt="Tiện nghi đẳng cấp tại Khách sạn Hà Nội"
              className="h-[480px] w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="pointer-events-none absolute -right-4 -top-4 -z-10 h-32 w-32 rounded-lg border border-gold/40 lg:-right-6 lg:-top-6 lg:h-44 lg:w-44" />
        </Reveal>

        {/* Nội dung */}
        <Reveal delay={120} className="order-1 lg:order-2">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Trải nghiệm</span>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-charcoal md:text-5xl">Tiện nghi & Dịch vụ</h2>
          <p className="mt-6 font-body text-[15px] leading-relaxed text-charcoal/70">
            Khách sạn Hà Nội mang đến những tiện nghi đẳng cấp nhằm tạo nên một kỳ nghỉ đáng nhớ: phòng gym hiện đại,
            liệu pháp spa thư giãn, ẩm thực tinh tế, không gian linh hoạt cho sự kiện, lễ tân 24/7, Wi-Fi miễn phí và đưa đón sân bay.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            {amenities.map((a, i) => (
              <div key={i} className="group flex flex-col items-center gap-2.5 text-center sm:items-start sm:text-left">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gold shadow-subtle transition-all duration-300 group-hover:bg-gold group-hover:text-white">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
                </span>
                <span className="font-nav text-xs font-medium text-charcoal/75">{a.label}</span>
              </div>
            ))}
          </div>

          <a
            href="/amenities"
            className="mt-9 inline-flex items-center gap-2 rounded-sm border border-gold px-7 py-3 font-nav text-sm font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white"
          >
            Xem tất cả tiện nghi
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </Reveal>
      </div>
    </section>
  )
}

export default Amenities
