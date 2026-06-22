import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroBanner from '../components/common/HeroBanner';
import FeatureSection from '../components/common/FeatureSection';
import '../components/common/CommonComponents.css';

const Events = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="cc-page-wrapper">
      <Navbar />

      <HeroBanner 
        title="Họp & Sự Kiện" 
        subtitle="MEETINGS & EVENTS" 
        backgroundImage="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80" 
      />

      <div className="cc-intro">
        <h2 className="cc-intro-title">Không Gian Hoàn Hảo Cho Mọi Sự Kiện</h2>
        <div className="cc-intro-divider"></div>
        <p className="cc-intro-text">
          Từ những hội nghị quốc tế quy mô lớn đến những tiệc cưới xa hoa mang đậm dấu ấn cá nhân, hệ thống phòng tiệc và hội nghị của Hanoi Hotel luôn sẵn sàng đáp ứng mọi yêu cầu khắt khe nhất của bạn.
        </p>
      </div>

      <FeatureSection 
        title="Tiệc Cưới Trọn Gói (Weddings)"
        description="Ghi dấu ngày trọng đại trong không gian sảnh tiệc lộng lẫy không cột trụ, sức chứa lên tới 1000 khách. Đội ngũ chuyên viên sự kiện của chúng tôi sẽ đồng hành cùng bạn để lên ý tưởng trang trí, chọn thực đơn và dàn dựng sân khấu hoàn hảo nhất."
        image="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80"
        buttonText="Nhận Báo Giá"
      />

      <FeatureSection 
        title="Hội Nghị & Hội Thảo (Meetings)"
        description="Hệ thống 5 phòng họp đa năng được trang bị công nghệ nghe nhìn tối tân, internet tốc độ cao và vách ngăn di động linh hoạt. Phù hợp cho các buổi ký kết hợp đồng, training nhân viên hay đại hội cổ đông."
        image="https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80"
        reversed={true}
        buttonText="Liên Hệ Chuyên Viên"
        altBg={true}
      />

      <Footer />
    </div>
  );
};

export default Events;
