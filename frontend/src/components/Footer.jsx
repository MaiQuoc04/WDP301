import './Footer.css'

const LotusLogo = () => (
  <svg className="footer__logo" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="currentColor" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="currentColor" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="currentColor" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="currentColor" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="currentColor" />
  </svg>
)

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <LotusLogo />
            <h3>HANOI HOTEL</h3>
            <p>Live Oriental Heritage</p>
          </div>
          
          <div className="footer__explore">
            <h4 className="footer__section-title">Khám Phá</h4>
            <ul className="footer__links">
              <li><a href="/">Trang chủ</a></li>
              <li><a href="/lien-he">Liên hệ</a></li>
              <li><a href="/loai-phong">Loại phòng</a></li>
              <li><a href="/thu-vien">Thư viện</a></li>
              <li><a href="/am-thuc">Ẩm thực</a></li>
              <li><a href="/tin-tuc">Tin tức</a></li>
              <li><a href="/hop-su-kien">Họp & Sự kiện</a></li>
              <li><a href="/uu-dai">Ưu đãi</a></li>
            </ul>
          </div>
          
          <div className="footer__address">
            <h4 className="footer__section-title">Địa Chỉ</h4>
            <ul className="footer__contact">
              <li>
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <span>D8 Giảng Võ, Phường Giảng Võ, Hà Nội</span>
              </li>
              <li>
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.25-3.95-6.847-6.847l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                <span>(+84) 24 3845 2270</span>
              </li>
              <li>
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                <span>(+84) 88 856 0126</span>
              </li>
              <li>
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.909A2.25 2.25 0 012.25 6.993V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243" /></svg>
                <span>sales@hanoihotel.com.vn</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="footer__bottom">
          <div className="footer__copy">
            © 2024 HANOI HOTEL. All rights reserved.
          </div>
          <div className="footer__legal">
            <a href="/dieu-khoan">Điều khoản</a>
            <a href="/bao-mat">Chính sách Bảo mật và Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
