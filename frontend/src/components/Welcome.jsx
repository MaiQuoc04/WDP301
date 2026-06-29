import Reveal from './common/Reveal'

const stats = [
  { value: '218', label: 'Phòng & Suite' },
  { value: '5★', label: 'Tiêu chuẩn Quốc tế' },
  { value: 'Hồ Giảng Võ', label: 'Vị trí trung tâm' },
]

const Welcome = () => {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container mx-auto grid items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-10">
        {/* Nội dung */}
        <Reveal>
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Chào mừng Quý khách</span>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-charcoal md:text-5xl">
            Khách sạn Hà Nội
          </h2>
          <p className="mt-6 font-body text-[15px] leading-relaxed text-charcoal/70">
            Khách sạn Hà Nội là khách sạn Quốc tế đầu tiên tại Hà Nội với 218 phòng nghỉ tiện nghi, hiện đại và sang trọng.
            Đặc biệt, sở hữu vị trí trung tâm bên Hồ Giảng Võ thanh bình, kết nối thuận tiện với các văn phòng chính phủ,
            đại sứ quán, khu thương mại sầm uất, nhà hàng... Khách sạn là điểm dừng chân lý tưởng cho du khách trong và ngoài
            nước mỗi khi có chuyến công tác hay du lịch cùng bạn bè và người thân.
          </p>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-charcoal/70">
            Bên cạnh đó, Khách sạn Hà Nội nổi tiếng là địa chỉ hàng đầu về ẩm thực Trung Hoa cùng các dịch vụ giải trí phong phú,
            hy vọng sẽ đem lại cho Quý khách những trải nghiệm thú vị và hài lòng nhất.
          </p>

          {/* Stat row */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-black/10 pt-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-2xl font-semibold text-gold md:text-3xl">{s.value}</div>
                <div className="mt-1 font-nav text-[11px] uppercase tracking-wide text-charcoal/55">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Hình ảnh */}
        <Reveal delay={150} className="relative">
          <div className="overflow-hidden rounded-lg shadow-elevated">
            <img
              src="https://images.unsplash.com/photo-1455587734955-081b22074882?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80"
              alt="Không gian sang trọng Khách sạn Hà Nội"
              className="h-[500px] w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          {/* Khung trang trí gold */}
          <div className="pointer-events-none absolute -bottom-4 -left-4 -z-10 h-32 w-32 rounded-lg border border-gold/40 lg:-bottom-6 lg:-left-6 lg:h-44 lg:w-44" />
        </Reveal>
      </div>
    </section>
  )
}

export default Welcome
