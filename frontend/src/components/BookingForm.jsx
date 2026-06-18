import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import './BookingForm.css'

const BookingForm = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleSubmit = (e) => {
    e.preventDefault()
    const checkin = document.getElementById('checkin').value
    const checkout = document.getElementById('checkout').value
    const adults = document.getElementById('adults').value
    const children = document.getElementById('children').value
    const queryParams = `?checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}`

    if (!user) {
      navigate(`/login?redirect=/booking${queryParams}`)
    } else {
      navigate(`/booking${queryParams}`)
    }
  }

  return (
    <div className="booking-form-overlay">
      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="checkin">Ngày nhận phòng *</label>
          <input 
            type="date" 
            id="checkin"
            className="booking-form__input" 
            placeholder="Ngày nhận phòng" 
            required
          />
        </div>
        
        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="checkout">Ngày trả phòng *</label>
          <input 
            type="date" 
            id="checkout"
            className="booking-form__input" 
            placeholder="Ngày trả phòng" 
            required
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
