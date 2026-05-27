import { useState } from 'react'
import './FeaturedRoom.css'

const rooms = [
  {
    id: 1,
    title: 'Premium\nExecutive Suite',
    features: [
      { text: 'Giường King/ 2 Giường đơn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5m-3-4.5h-4.5m-6 4.5h.008v.008H7.5V13.5zm6 0h.008v.008H13.5V13.5z" /> },
      { text: '2 Người lớn & 1 Trẻ em', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
      { text: '50 m²', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 8.25m0 0H17.25l-2.659 2.849m-2.048 2.194L9.257 13.5m0 0L14.25 21.75 12 15.75" /> },
      { text: 'Hướng hồ', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /> }
    ],
    image: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    link: '/rooms/executive'
  },
  {
    id: 2,
    title: 'Phòng Deluxe\nCity View',
    features: [
      { text: '1 Giường King lớn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5m-3-4.5h-4.5m-6 4.5h.008v.008H7.5V13.5zm6 0h.008v.008H13.5V13.5z" /> },
      { text: '2 Người lớn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
      { text: '40 m²', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 8.25m0 0H17.25l-2.659 2.849m-2.048 2.194L9.257 13.5m0 0L14.25 21.75 12 15.75" /> },
      { text: 'Hướng thành phố', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6.75h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /> }
    ],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    link: '/rooms/deluxe'
  },
  {
    id: 3,
    title: 'Presidential\nSuite',
    features: [
      { text: '2 Phòng ngủ', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5m-3-4.5h-4.5m-6 4.5h.008v.008H7.5V13.5zm6 0h.008v.008H13.5V13.5z" /> },
      { text: '4 Người lớn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
      { text: '120 m²', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 8.25m0 0H17.25l-2.659 2.849m-2.048 2.194L9.257 13.5m0 0L14.25 21.75 12 15.75" /> },
      { text: 'Toàn cảnh hồ', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /> }
    ],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    link: '/rooms/presidential'
  }
]

const FeaturedRoom = () => {
  const [current, setCurrent] = useState(0)

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % rooms.length)
  }

  const activeRoom = rooms[current]

  return (
    <section className="featured-room">
      <div className="featured-room__content">
        <div key={`text-${activeRoom.id}`} className="featured-room__text-wrap">
          <h2 className="featured-room__title">
            {activeRoom.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </h2>
          
          <ul className="featured-room__features">
            {activeRoom.features.map((feature, i) => (
              <li key={i} className="featured-room__feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  {feature.icon}
                </svg>
                {feature.text}
              </li>
            ))}
          </ul>
          
          <a href={activeRoom.link} className="featured-room__link">Xem phòng</a>
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
              key={room.id}
              className="featured-room__slide"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              <img src={room.image} alt={room.title.replace('\n', ' ')} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedRoom
