// File: src/data/mockData.jsx
// Nơi lưu trữ tập trung toàn bộ dữ liệu mock cho giao diện (Dễ dàng thay thế bằng API thực tế sau này)

export const featuredRoomsData = [
  {
    id: 1,
    title: 'Premium\nExecutive Suite',
    features: [
      { text: 'Giường King/ 2 Giường đơn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5m-3-4.5h-4.5m-6 4.5h.008v.008H7.5V13.5zm6 0h.008v.008H13.5V13.5z" /> },
      { text: '2 Người lớn & 1 Trẻ em', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
      { text: '50 m²', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 8.25m0 0H17.25l-2.659 2.849m-2.048 2.194L9.257 13.5m0 0L14.25 21.75 12 15.75" /> },
      { text: 'Hướng hồ', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /> }
    ],
    image: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    link: '/rooms/executive'
  },
  {
    id: 2,
    title: 'Phòng Deluxe\nCity View',
    features: [
      { text: '1 Giường King lớn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5m-3-4.5h-4.5m-6 4.5h.008v.008H7.5V13.5zm6 0h.008v.008H13.5V13.5z" /> },
      { text: '2 Người lớn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /> },
      { text: '40 m²', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 8.25m0 0H17.25l-2.659 2.849m-2.048 2.194L9.257 13.5m0 0L14.25 21.75 12 15.75" /> },
      { text: 'Hướng thành phố', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6.75h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /> }
    ],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    link: '/rooms/deluxe'
  },
  {
    id: 3,
    title: 'Presidential\nSuite',
    features: [
      { text: '2 Phòng ngủ', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5m-3-4.5h-4.5m-6 4.5h.008v.008H7.5V13.5zm6 0h.008v.008H13.5V13.5z" /> },
      { text: '4 Người lớn', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
      { text: '120 m²', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 8.25m0 0H17.25l-2.659 2.849m-2.048 2.194L9.257 13.5m0 0L14.25 21.75 12 15.75" /> },
      { text: 'Toàn cảnh hồ', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /> }
    ],
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    link: '/rooms/presidential'
  }
];

export const roomCardsData = [
  {
    id: 1,
    title: 'Phòng Deluxe',
    description: 'Trải nghiệm không gian nghỉ dưỡng thanh lịch với tầm nhìn bao quát thành phố, mang đậm dấu ấn Á Đông đương đại.',
    price: '2.500.000',
    image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    link: '/rooms/deluxe'
  },
  {
    id: 2,
    title: 'Phòng Executive',
    description: 'Thiết kế tinh xảo kết hợp cùng nội thất cao cấp, mang đến sự riêng tư tuyệt đối và đặc quyền vào Executive Lounge.',
    price: '3.800.000',
    image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    link: '/rooms/executive'
  },
  {
    id: 3,
    title: 'Phòng Suite Hướng Hồ',
    description: 'Hạng phòng sang trọng bậc nhất với tầm nhìn panorama trọn vẹn ra khung cảnh hoàng hôn lãng mạn của Hồ Giảng Võ.',
    price: '5.500.000',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    link: '/rooms/suite'
  }
];

export const specialOffersData = [
  { 
    id: 1, 
    title: "Children's Day", 
    image: 'https://images.unsplash.com/photo-1543330091-27228394c7dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 
    link: '/offer/1' 
  },
  { 
    id: 2, 
    title: "Summer Unlocked", 
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 
    link: '/offer/2' 
  },
  { 
    id: 3, 
    title: "Sturgeon Essence", 
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 
    link: '/offer/3' 
  },
];

export const diningData = [
  {
    id: 1,
    title: 'Nhà hàng Kim Long',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/dining/kim-long'
  },
  {
    id: 2,
    title: 'Lobby Bar',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/dining/lobby-bar'
  },
  {
    id: 3,
    title: 'Nhà hàng Hoàng Triều',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/dining/hoang-trieu'
  }
];

export const testimonialsData = [
  {
    id: 1,
    title: 'Trải nghiệm đáng nhớ',
    text: '"Cảnh hồ rất thư giãn, buffet sáng tuyệt vời và nhân viên thì rất chu đáo, sẵn sàng hỗ trợ để đảm bảo chúng tôi có đầy đủ mọi thứ mà chúng tôi cần."',
    author: 'Michael T',
    location: 'Singapore'
  },
  {
    id: 2,
    title: 'Khách sạn tuyệt vời giữa lòng thủ đô',
    text: '"Đây là khách sạn yêu thích của tôi mỗi lần đến Hà Nội. Phòng nghỉ lúc nào cũng sạch sẽ, dịch vụ tốt và nhân viên chu đáo. Bữa trưa và tối ở đây cũng rất ngon."',
    author: 'Satoshi K',
    location: 'Nhật Bản'
  },
  {
    id: 3,
    title: 'Cảnh đẹp và dịch vụ tốt',
    text: '"Khách sạn Hà Nội có cảnh hồ đẹp, đội ngũ nhân viên rất thân thiện và luôn hỗ trợ nhiệt tình. Chắc chắn tôi sẽ còn quay lại đây lần nữa!"',
    author: 'Linh N',
    location: 'Việt Nam'
  },
  {
    id: 4,
    title: 'Ẩm thực chuẩn vị Trung Hoa',
    text: '"Nhà hàng ẩm thực Trung Hoa của khách sạn thật sự rất tuyệt vời. Tôi đặc biệt ấn tượng với những món Dimsum ở đây, một trong những món Dimsum ngon nhất tôi từng thử!"',
    author: 'Ryan H',
    location: 'Singapore'
  }
];
