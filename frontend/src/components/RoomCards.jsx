import Reveal from './common/Reveal'

const bedLabel = (t) =>
  t === 'king' ? 'Giường King' : t === 'double' ? 'Giường Đôi' : t === 'twin' ? '2 Giường Đơn' : 'Giường Đơn'

const RoomCards = ({ rooms = [] }) => {
  if (!rooms || rooms.length === 0) return null

  return (
    <section className="bg-off-white py-20 md:py-28">
      <div className="container mx-auto px-5 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Lưu trú</span>
          <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Hạng Phòng Cao Cấp</h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-charcoal/60">
            Tận hưởng không gian nghỉ dưỡng đẳng cấp mang đậm dấu ấn di sản phương Đông.
          </p>
        </Reveal>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, i) => (
            <Reveal
              as="article"
              delay={i * 120}
              key={room._id}
              className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-raised transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated"
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={room.images?.length ? room.images[0] : 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80'}
                  alt={room.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-2xl font-semibold text-charcoal">{room.name}</h3>

                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-charcoal/55">
                  {room.bedType && <li>{bedLabel(room.bedType)}</li>}
                  {room.capacity != null && <li>· {room.capacity} khách</li>}
                  {room.area != null && <li>· {room.area} m²</li>}
                </ul>

                {room.description && (
                  <p className="mt-3 line-clamp-2 font-body text-sm leading-relaxed text-charcoal/65">{room.description}</p>
                )}

                <div className="mt-auto flex items-end justify-between pt-6">
                  <div>
                    <span className="block font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Chỉ từ</span>
                    <span className="font-display text-xl font-semibold text-gold">
                      {room.basePrice != null ? `${room.basePrice.toLocaleString('vi-VN')} ₫` : 'Liên hệ'}
                      {room.basePrice != null && <span className="text-sm font-normal text-charcoal/50"> /đêm</span>}
                    </span>
                  </div>
                  <a
                    href={`/rooms/${room._id}`}
                    className="group/link inline-flex items-center gap-1.5 font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:text-gold-hover"
                  >
                    Chi tiết
                    <svg className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RoomCards
