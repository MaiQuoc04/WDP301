import './Welcome.css'

const Welcome = () => {
  return (
    <section className="section welcome">
      <div className="container">
        <div className="welcome__grid">
          <div className="welcome__content">
            <h2 className="welcome__title">Chào mừng Quý khách đến với Khách sạn Hà Nội</h2>
            <p className="welcome__text">
              Khách sạn Hà Nội là khách sạn Quốc tế đầu tiên tại Hà Nội với 218 phòng nghỉ tiện nghi, hiện đại và sang trọng. Đặc biệt, sở hữu vị trí trung tâm bên Hồ Giảng Võ thanh bình, kết nối thuận tiện với các văn phòng chính phủ, đại sứ quán, khu thương mại sầm uất, nhà hàng... Khách sạn là điểm dừng chân lý tưởng cho du khách trong và ngoài nước mỗi khi có chuyến công tác hay du lịch cùng bạn bè và người thân. Bên cạnh đó, Khách sạn Hà Nội nổi tiếng là địa chỉ hàng đầu về ẩm thực Trung Hoa cùng các dịch vụ giải trí phong phú, hy vọng sẽ đem lại cho Quý khách những trải nghiệm thú vị và hài lòng nhất.
            </p>
          </div>
          <div className="welcome__image-wrap">
            <img src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Hanoi City Skyline" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Welcome
