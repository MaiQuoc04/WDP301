import { useState } from 'react'
import './FeaturedRoom.css'

const FeaturedRoom = ({ rooms = [] }) => {
  const [current, setCurrent] = useState(0)

  if (!rooms || rooms.length === 0) return null

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % rooms.length)
  }

  const activeRoom = rooms[current]

  return (
    <section className="featured-room">
      <div className="featured-room__content">
        <div key={`text-${activeRoom._id}`} className="featured-room__text-wrap">
          <h2 className="featured-room__title">
            {activeRoom.name}
          </h2>
          
          <ul className="featured-room__features">
              <li className="featured-room__feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5m-3-4.5h-4.5m-6 4.5h.008v.008H7.5V13.5zm6 0h.008v.008H13.5V13.5z" />
                </svg>
                {activeRoom.bedType === 'king' ? 'Giường King' : activeRoom.bedType === 'double' ? 'Giường Đôi' : activeRoom.bedType === 'twin' ? '2 Giường Đơn' : 'Giường Đơn'}
              </li>
              <li className="featured-room__feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {activeRoom.capacity} Người lớn
              </li>
              <li className="featured-room__feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 8.25m0 0H17.25l-2.659 2.849m-2.048 2.194L9.257 13.5m0 0L14.25 21.75 12 15.75" />
                </svg>
                {activeRoom.area} m²
              </li>
          </ul>
          
          <a href={`/rooms/${activeRoom._id}`} className="featured-room__link">Xem chi tiết</a>
        </div>

        <button className="featured-room__nav" onClick={handleNext} aria-label="Next room">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      
      <div className="featured-room__slider-area">
        <div className="featured-room__track">
          {rooms.map((room) => (
            <div 
              key={room._id}
              className="featured-room__slide"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              <img src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80'} alt={room.name} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedRoom
