import { roomCardsData as rooms } from '../data/mockData'
import './RoomCards.css'

const RoomCards = () => {
  return (
    <section className="section section--alt room-cards">
      <div className="container">
        <div className="room-cards__header">
          <h2 className="room-cards__title">Hạng Phòng Cao Cấp</h2>
          <p className="room-cards__subtitle">Tận hưởng không gian nghỉ dưỡng đẳng cấp mang đậm dấu ấn di sản</p>
        </div>

        <div className="room-cards__grid">
          {rooms.map(room => (
            <div key={room.id} className="premium-card">
              <div className="premium-card__image-wrap">
                <img src={room.image} alt={room.title} className="premium-card__img" />
              </div>
              <div className="premium-card__content">
                <h3 className="premium-card__title">{room.title}</h3>
                <p className="premium-card__desc">{room.description}</p>
                <div className="premium-card__footer">
                  <span className="premium-card__price">Từ {room.price} / đêm</span>
                  <button className="btn btn--tertiary">CHI TIẾT</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RoomCards
