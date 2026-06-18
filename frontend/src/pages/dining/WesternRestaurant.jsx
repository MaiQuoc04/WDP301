import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import HeroBanner from '../../components/common/HeroBanner';
import FeatureSection from '../../components/common/FeatureSection';
import '../../components/common/CommonComponents.css';

const WesternRestaurant = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="cc-page-wrapper">
      <Navbar />

      <HeroBanner 
        title="Nhà Hàng Phương Tây" 
        subtitle="DINING" 
        backgroundImage="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80" 
      />

      <div className="cc-intro">
        <h2 className="cc-intro-title">Hương Vị Châu Âu Tinh Tế</h2>
        <div className="cc-intro-divider"></div>
        <p className="cc-intro-text">
          Nhà hàng Phương Tây mang đậm phong cách kiến trúc Pháp cổ điển, phục vụ các món ăn thượng hạng từ Châu Âu. Điểm nhấn là thăn bò Wagyu nướng mềm mọng nước cùng bộ sưu tập rượu vang hảo hạng được tinh tuyển từ khắp nơi trên thế giới.
        </p>
      </div>

      <FeatureSection 
        title="Bò Bít Tết Thượng Hạng & Rượu Vang"
        description="Trải nghiệm nghệ thuật ẩm thực tinh tế với những lát thịt bò hảo hạng, được chế biến thủ công bởi các chuyên gia ẩm thực hàng đầu. Thưởng thức trọn vẹn hơn khi kết hợp cùng một ly rượu vang đỏ được các Sommelier gợi ý riêng cho bạn."
        image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80"
      />

      <Footer />
    </div>
  );
};

export default WesternRestaurant;
