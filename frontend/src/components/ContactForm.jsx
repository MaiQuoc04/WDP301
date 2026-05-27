import './ContactForm.css'

const ContactForm = () => {
  return (
    <section className="contact-form-section">
      <div className="container contact-form-container">
        <div className="contact-form__info">
          <h2>Bạn cần tư vấn?</h2>
          <p>Hãy chia sẻ ý kiến của bạn với chúng tôi. Đừng quên để lại thông tin liên lạc của bạn ở biểu mẫu bên cạnh nhé!</p>
        </div>
        
        <div className="contact-form__wrapper">
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="contact-form__row">
              <div className="contact-form__group">
                <input type="text" className="contact-form__input" placeholder="Họ và tên" required />
              </div>
              <div className="contact-form__group">
                <input type="tel" className="contact-form__input" placeholder="Số điện thoại" required />
              </div>
            </div>
            
            <div className="contact-form__group">
              <input type="email" className="contact-form__input" placeholder="Email" />
            </div>
            
            <div className="contact-form__group">
              <textarea className="contact-form__textarea" placeholder="Lời nhắn" required></textarea>
            </div>
            
            <button type="submit" className="contact-form__submit">Gửi</button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactForm
