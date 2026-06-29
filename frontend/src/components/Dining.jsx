import Reveal from './common/Reveal'

const Dining = ({ dining = [] }) => {
  if (!dining || dining.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-charcoal py-20 text-white md:py-28">
      {/* Hoạ tiết nền mờ */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-gold blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-96 w-96 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="container relative mx-auto px-5 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light">Ẩm thực</span>
          <h2 className="mt-4 font-display text-4xl font-medium md:text-5xl">Tinh hoa ẩm thực Trung Hoa</h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-white/65">
            Khám phá thế giới ẩm thực phong phú với các món Quảng Đông, Hồng Kông và những xửng Dimsum trứ danh,
            trong không gian tinh tế giữa lòng thủ đô.
          </p>
        </Reveal>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {dining.map((item, index) => (
            <Reveal
              as="a"
              key={item._id}
              delay={index * 120}
              href="/dining"
              className="group relative block h-80 overflow-hidden rounded-lg"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-2xl font-semibold drop-shadow">{item.name}</h3>
                <div className="mt-3 inline-flex items-center gap-1.5 font-nav text-xs font-semibold uppercase tracking-wide text-gold-light">
                  <span className="h-px w-6 bg-gold-light transition-all duration-300 group-hover:w-10" />
                  Xem thêm
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Dining
