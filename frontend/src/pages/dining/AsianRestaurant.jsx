import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import HeroBanner from '../../components/common/HeroBanner';
import FeatureSection from '../../components/common/FeatureSection';
import InfoGrid from '../../components/common/InfoGrid';
import MasonryGallery from '../../components/common/MasonryGallery';
import { useNavigate } from 'react-router-dom';
import '../../components/common/CommonComponents.css'; // Global CSS for the generic components

const AsianRestaurant = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const galleryImages = [
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1582450871972-ab5ce211154f?auto=format&fit=crop&q=80&w=800"
  ];

  const infoItems = [
    {
      title: "Opening Hours",
      details: [
        { text: "Lunch: 11:30 - 14:00" },
        { text: "Dinner: 17:30 - 22:00" }
      ]
    },
    {
      title: "Dim Sum All You Can Eat",
      details: [
        { text: "Adult: VND 398,000++" },
        { text: "Child: VND 288,000++" },
        { text: "* Prices are subject to 5% service charge and VAT", style: { fontSize: '12px', marginTop: '10px', fontStyle: 'italic' } }
      ]
    },
    {
      title: "Features",
      details: [
        { text: "Authentic Cantonese Cuisine" },
        { text: "Special Dim Sum" },
        { text: "4 Private Dining Rooms" }
      ]
    }
  ];

  return (
    <div className="cc-page-wrapper">
      <Navbar />

      <HeroBanner 
        title="Golden Dragon Restaurant" 
        subtitle="DINING" 
        backgroundImage="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1920" 
      />

      <div className="cc-intro">
        <h2 className="cc-intro-title">Nhà Hàng Golden Dragon</h2>
        <div className="cc-intro-divider"></div>
        <p className="cc-intro-text">
          Being the most authentic Chinese dining venue in Hanoi, Golden Dragon Restaurant opens 
          for lunch and dinner daily, featuring superb Cantonese cuisine and dim sum 
          prepared by our talented chefs. The restaurant offers a luxurious and private 
          atmosphere, making it the perfect place for business meetings, family gatherings, 
          and romantic dinners.
        </p>
      </div>

      <InfoGrid items={infoItems} />

      <FeatureSection 
        title="Hương Vị Quảng Đông Đích Thực"
        description="Thực đơn của chúng tôi là một bản giao hưởng của hương vị, kết hợp kỹ thuật chế biến tinh tế và nguyên liệu tươi ngon nhất. Từ món vịt quay Bắc Kinh trứ danh với lớp da giòn rụm đến các món hải sản cao cấp được chế biến kỳ công, mỗi món ăn tại Golden Dragon đều là một kiệt tác nghệ thuật ẩm thực."
        image="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=1000"
        buttonText="View Menu"
      />

      <FeatureSection 
        title="Không Gian Sang Trọng & Riêng Tư"
        description="Nhà hàng sở hữu thiết kế kết hợp hài hòa giữa nét truyền thống phương Đông và sự sang trọng hiện đại. Với hệ thống 4 phòng VIP riêng biệt (Private Dining Rooms), Golden Dragon đáp ứng mọi nhu cầu từ tiệc gia đình ấm cúng đến các buổi chiêu đãi đối tác quan trọng trong không gian riêng tư tuyệt đối."
        image="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=1000"
        reversed={true}
      />

      <MasonryGallery title="Gallery" images={galleryImages} />

      <Footer />
    </div>
  );
};

export default AsianRestaurant;
