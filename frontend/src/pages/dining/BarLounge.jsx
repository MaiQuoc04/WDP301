import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import HeroBanner from '../../components/common/HeroBanner';
import FeatureSection from '../../components/common/FeatureSection';
import '../../components/common/CommonComponents.css';

const BarLounge = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featurePoints = [
    { label: "Trà chiều", text: "14:00 – 17:00" },
    { label: "Cocktail Hour", text: "18:00 – 24:00" },
    { label: "Vị trí", text: "Sảnh chính (Tầng 1)" }
  ];

  return (
    <div className="cc-page-wrapper">
      <Navbar />

      <HeroBanner 
        title="Quầy Bar & Lounge" 
        subtitle="ENTERTAINMENT" 
        backgroundImage="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80" 
      />

      <div className="cc-intro">
        <h2 className="cc-intro-title">Không Gian Thư Giãn Tuyệt Đối</h2>
        <div className="cc-intro-divider"></div>
        <p className="cc-intro-text">
          Nằm tại sảnh chính của khách sạn, Quầy Bar & Lounge là nơi lý tưởng để thưởng thức ly cocktail độc đáo, nhâm nhi một tách trà chiều hoặc thư giãn cùng điệu nhạc Jazz du dương vào mỗi buổi tối.
        </p>
      </div>

      <FeatureSection 
        title="Cocktails & Trà Chiều"
        description="Khám phá thực đơn đồ uống đa dạng từ các loại cocktail sáng tạo, bia thủ công đến set trà chiều (High Tea) kiểu Anh truyền thống với các loại bánh ngọt tinh xảo. Đây là không gian hoàn hảo cho những cuộc gặp mặt đối tác hoặc tán gẫu cùng bạn bè."
        image="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80"
        bulletPoints={featurePoints}
      />

      <Footer />
    </div>
  );
};

export default BarLounge;
