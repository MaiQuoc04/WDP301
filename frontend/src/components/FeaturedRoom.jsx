import { useState } from 'react'

const bedLabel = (t) =>
  t === 'king' ? 'Giường King' : t === 'double' ? 'Giường Đôi' : t === 'twin' ? '2 Giường Đơn' : 'Giường Đơn'

const FeaturedRoom = ({ rooms = [] }) => {
  const [current, setCurrent] = useState(0)

  if (!rooms || rooms.length === 0) return null

  const handleNext = () => setCurrent((prev) => (prev + 1) % rooms.length)
  const activeRoom = rooms[current]

  return (
    <section className="relative overflow-hidden bg-charcoal text-white">
      <div className="grid lg:grid-cols-2">
        {/* Hình ảnh */}
        <div className="relative h-80 overflow-hidden lg:h-auto lg:min-h-[560px]">
          {rooms.map((room, i) => (
            <img
              key={room._id}
              src={room.images?.length ? room.images[0] : 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80'}
              alt={room.name}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-charcoal/40 lg:to-charcoal/60" />
        </div>

        {/* Nội dung */}
        <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light">Phòng nổi bật</span>

          <div key={activeRoom._id} className="animate-fade-in-up">
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight md:text-5xl">{activeRoom.name}</h2>

            <ul className="mt-7 flex flex-wrap gap-6 font-body text-sm text-white/75">
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gold-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5" /></svg>
                {bedLabel(activeRoom.bedType)}
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gold-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.584-7.5-1.632z" /></svg>
                {activeRoom.capacity} Người lớn
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gold-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>
                {activeRoom.area} m²
              </li>
            </ul>

            {activeRoom.description && (
              <p className="mt-6 max-w-md font-body text-[15px] leading-relaxed text-white/65 line-clamp-3">{activeRoom.description}</p>
            )}

            {activeRoom.basePrice != null && (
              <p className="mt-6 font-display text-2xl font-semibold text-gold-light">
                Từ {activeRoom.basePrice.toLocaleString('vi-VN')} ₫
                <span className="text-base font-normal text-white/50"> /đêm</span>
              </p>
            )}
          </div>

          <div className="mt-9 flex items-center gap-5">
            <a
              href={`/rooms/${activeRoom._id}`}
              className="rounded-sm bg-gold px-7 py-3 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover"
            >
              Xem chi tiết
            </a>
            {rooms.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="font-display text-sm text-white/50">
                  {String(current + 1).padStart(2, '0')} / {String(rooms.length).padStart(2, '0')}
                </span>
                <button
                  onClick={handleNext}
                  aria-label="Phòng tiếp theo"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 transition-colors hover:border-gold hover:bg-gold"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedRoom
