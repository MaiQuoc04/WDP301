import './Amenities.css'

const Amenities = () => {
  return (
    <section className="section amenities">
      <div className="container">
        <div className="amenities__grid">
          <div className="amenities__image-wrap">
            <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Tennis court and balls" />
          </div>
          <div className="amenities__content">
            <h2 className="amenities__title">Các tiện nghi</h2>
            <p className="amenities__text">
              Khách sạn Hà Nội mang đến những tiện nghi đẳng cấp nhằm tạo nên một kỳ nghỉ đáng nhớ cho Quý khách. Rèn luyện sức khỏe tại phòng gym hiện đại, thư giãn với các liệu pháp spa và tận hưởng ẩm thực tinh tế tại nhà hàng trong khuôn viên khách sạn. Chúng tôi cung cấp không gian linh hoạt cho các sự kiện, dịch vụ hỗ trợ thông tin cùng lễ tân 24/7. Wi-Fi miễn phí và đưa đón sân bay thuận tiện, đảm bảo sự thoải mái và tiện nghi trọn vẹn trong suốt thời gian lưu trú của Quý khách.
            </p>
            <a href="/amenities" className="amenities__link">Xem thêm</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Amenities
