import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroBanner from '../components/common/HeroBanner';
import FeatureSection from '../components/common/FeatureSection';
import '../components/common/CommonComponents.css';

const Facilities = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nightClubPoints = [
    { label: "Giờ hoạt động", text: "19:30 - 02:00 sáng" },
    { label: "Phòng VIP", text: "Hơn 30 phòng Karaoke VIP" },
    { label: "Dịch vụ", text: "Các gói đồ uống thượng hạng và trái cây tươi" }
  ];

  const gymPoints = [
    { label: "Giờ hoạt động", text: "06:00 - 22:00 mỗi ngày" },
    { label: "Trang thiết bị", text: "Máy chạy bộ, xe đạp tập, khu vực tạ tự do" },
    { text: "Miễn phí cho khách lưu trú tại khách sạn" }
  ];

  return (
    <div className="cc-page-wrapper dark">
      <Navbar />

      <HeroBanner 
        title="Hanoi Night Club & Tiện Nghi" 
        subtitle="ENTERTAINMENT & WELLNESS" 
        backgroundImage="https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80" 
      />

      <FeatureSection 
        title="Hanoi Night Club"
        description="Tọa lạc tại tầng trệt của Hanoi Hotel, Hanoi Night Club là điểm đến giải trí đẳng cấp bậc nhất thủ đô. Với hệ thống âm thanh ánh sáng tối tân và các phòng Karaoke VIP được thiết kế xa hoa mang đậm phong cách hoàng gia, nơi đây hứa hẹn những đêm tiệc bùng nổ, âm nhạc cuồng nhiệt và những trải nghiệm không thể nào quên."
        image="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80"
        bulletPoints={nightClubPoints}
        buttonText="Đặt Phòng VIP"
      />

      <FeatureSection 
        title="Spa & Wellness"
        description={[
          "Tạm lánh khỏi sự nhộn nhịp của thành phố và bước vào ốc đảo bình yên tại khu vực Spa & Wellness của chúng tôi. Tại đây, các chuyên viên trị liệu giàu kinh nghiệm sẽ giúp bạn phục hồi năng lượng thể chất và tinh thần thông qua các liệu pháp massage chuyên sâu, xông hơi khô (Sauna) và hồ bơi thư giãn.",
          "Mỗi liệu trình đều sử dụng các tinh chất thiên nhiên cao cấp, đánh thức mọi giác quan và đem lại sự thư thái tuyệt đối."
        ]}
        image="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80"
        reversed={true}
        altBg={true}
      />

      <FeatureSection 
        title="Trung Tâm Thể Hình"
        description="Duy trì vóc dáng và thói quen rèn luyện sức khỏe ngay cả trong những chuyến công tác hay kỳ nghỉ dưỡng. Trung tâm thể hình của chúng tôi được trang bị đầy đủ các máy móc tập luyện hiện đại nhất từ các thương hiệu hàng đầu thế giới."
        image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80"
        bulletPoints={gymPoints}
      />

      <Footer />
    </div>
  );
};

export default Facilities;
