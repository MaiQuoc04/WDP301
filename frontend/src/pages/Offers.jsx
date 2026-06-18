import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import HeroBanner from '../components/common/HeroBanner';
import './Offers.css';

const Offers = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const offers = [
    {
      title: "Gói Nghỉ Dưỡng Cuối Tuần",
      badge: "Lưu Trú",
      desc: "Tận hưởng kỳ nghỉ trọn vẹn với ưu đãi giảm giá 20% cho hạng phòng Suite. Tặng kèm bữa sáng buffet cho 2 người và một set trà chiều tại quầy Lounge để bạn có những phút giây thư giãn tuyệt đối bên người thân.",
      img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80"
    },
    {
      title: "Ưu Đãi Đặt Sớm (Early Bird)",
      badge: "Khuyến Mãi",
      desc: "Giảm ngay 15% trên tổng hóa đơn tiền phòng khi bạn đặt trước 30 ngày qua website chính thức. Khuyến mãi được áp dụng cho tất cả các hạng phòng tại Hanoi Hotel, không áp dụng kèm các chương trình khác.",
      img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
    },
    {
      title: "Trải Nghiệm Ẩm Thực Đỉnh Cao",
      badge: "Ẩm Thực",
      desc: "Tặng voucher trị giá 1.000.000 VNĐ tại Nhà hàng Golden Dragon khi đặt phòng từ 2 đêm trở lên. Thưởng thức mỹ vị ẩm thực Quảng Đông trong không gian đẳng cấp và sang trọng bậc nhất Hà Nội.",
      img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80"
    },
    {
      title: "Gói Trăng Mật Ngọt Ngào",
      badge: "Đặc Biệt",
      desc: "Nâng tầm kỳ nghỉ trăng mật với dịch vụ trang trí phòng hoa hồng miễn phí, tặng kèm một chai rượu vang sủi bọt (Sparkling Wine) và bánh kem chocolate nghệ thuật khi đặt phòng Premium Executive Suite.",
      img: "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&q=80"
    }
  ];

  return (
    <div className="offers-page">
      <Navbar />
      
      <HeroBanner 
        title="Ưu Đãi Đặc Quyền" 
        subtitle="PROMOTIONS" 
        backgroundImage="https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&q=80" 
      />

      <div className="offers-container">
        <div className="offers-header">
          <h2>Khám Phá Ưu Đãi Tốt Nhất</h2>
          <p>
            Chỉ dành riêng cho khách hàng đặt dịch vụ trực tiếp tại website của Hanoi Hotel. 
            Lựa chọn ngay cho mình một gói trải nghiệm hoàn hảo để tận hưởng kỳ nghỉ đáng nhớ với mức giá ưu đãi nhất.
          </p>
        </div>

        <Row gutter={[40, 40]}>
          {offers.map((offer, index) => (
            <Col xs={24} md={12} key={index}>
              <div className="offer-card">
                <div className="offer-img-wrap">
                  <div className="offer-badge">{offer.badge}</div>
                  <img src={offer.img} alt={offer.title} />
                </div>
                <div className="offer-content">
                  <h3>{offer.title}</h3>
                  <p>{offer.desc}</p>
                  <button className="offer-btn" onClick={() => navigate('/booking')}>
                    Tìm Hiểu Thêm
                  </button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <Footer />
    </div>
  );
};

export default Offers;
