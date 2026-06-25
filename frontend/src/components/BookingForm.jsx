import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { customerService } from '../services'
import './BookingForm.css'

// Thanh tìm phòng trên Hero (date-first): chi nhánh + ngày + số khách -> /booking xem phòng trống.
const BookingForm = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [branches, setBranches] = useState([])
  const [branch, setBranch] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState('2')
  const [children, setChildren] = useState('0')
  const [err, setErr] = useState('')

  useEffect(() => {
    customerService.getBranches().then((r) => setBranches(r.data || [])).catch(() => {})
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const parseGuestCount = (value, min) => {
    const n = Number(value)
    return Number.isInteger(n) && n >= min ? n : null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!branch) return setErr('Vui lòng chọn chi nhánh')
    if (!checkIn || !checkOut) return setErr('Vui lòng chọn ngày nhận và ngày trả')
    if (new Date(checkOut) <= new Date(checkIn)) return setErr('Ngày trả phải sau ngày nhận (tối thiểu 1 đêm)')
    const adultCount = parseGuestCount(adults, 1)
    const childCount = parseGuestCount(children, 0)
    if (adultCount == null) return setErr('Số người lớn phải từ 1 trở lên')
    if (childCount == null) return setErr('Số trẻ em không hợp lệ')
    setErr('')
    const params = new URLSearchParams({ branch, checkIn, checkOut, adults: adultCount, children: childCount }).toString()
    if (!user) navigate(`/login?redirect=${encodeURIComponent('/booking?' + params)}`)
    else navigate(`/booking?${params}`)
  }

  return (
    <div className="booking-form-overlay">
      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="booking-form__group">
          <label className="booking-form__label">Chi nhánh *</label>
          <select className="booking-form__select" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>

        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="checkin">Ngày nhận phòng *</label>
          <input type="date" id="checkin" className="booking-form__input" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
        </div>

        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="checkout">Ngày trả phòng *</label>
          <input type="date" id="checkout" className="booking-form__input" value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)} />
        </div>

        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="adults">Người lớn *</label>
          <input
            type="number"
            id="adults"
            className="booking-form__input"
            value={adults}
            min={1}
            step={1}
            inputMode="numeric"
            onChange={(e) => setAdults(e.target.value)}
          />
        </div>

        <div className="booking-form__group">
          <label className="booking-form__label" htmlFor="children">Trẻ em</label>
          <input
            type="number"
            id="children"
            className="booking-form__input"
            value={children}
            min={0}
            step={1}
            inputMode="numeric"
            onChange={(e) => setChildren(e.target.value)}
          />
        </div>

        <div className="booking-form__action">
          <button type="submit" className="btn btn--primary booking-form__btn">ĐẶT PHÒNG</button>
        </div>
      </form>
      {err && <div style={{ color: '#ffd9d9', marginTop: 10, fontSize: 13, textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{err}</div>}
    </div>
  )
}

export default BookingForm
