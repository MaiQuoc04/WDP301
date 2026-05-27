import { useState } from 'react'
import { featuredRoomsData as rooms } from '../data/mockData'
import './FeaturedRoom.css'

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
