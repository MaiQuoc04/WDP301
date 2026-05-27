import './BookingForm.css'

const BookingForm = () => {
  return (
    <div className="booking-form-overlay">
      <form className="booking-form" onSubmit={(e) => e.preventDefault()}>
        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="checkin">Ngày nhận phòng *</label>
          <input 
            type="date" 
            id="checkin"
            className="booking-form__input" 
            placeholder="Ngày nhận phòng" 
          />
        </div>
        
        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="checkout">Ngày trả phòng *</label>
          <input 
            type="date" 
            id="checkout"
            className="booking-form__input" 
            placeholder="Ngày trả phòng" 
          />
        </div>
        
        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="adults">Người lớn *</label>
          <select id="adults" className="booking-form__select" defaultValue="2">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
        
        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="children">Trẻ em</label>
          <select id="children" className="booking-form__select" defaultValue="0">
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3+</option>
          </select>
        </div>
        
        <div className="booking-form__action">
          <button type="submit" className="btn btn--primary booking-form__btn">
            ĐẶT PHÒNG
          </button>
        </div>
      </form>
    </div>
  )
}

export default BookingForm
