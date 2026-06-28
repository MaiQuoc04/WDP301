import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { customerService } from '../services'

// Thanh tìm phòng trên Hero (date-first): chi nhánh + ngày + số khách -> /booking xem phòng trống.
const fieldBase =
  'w-full rounded-sm border border-black/10 bg-white px-3.5 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/40'
const labelBase = 'mb-1.5 block font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/60'

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
    <div className="mx-auto max-w-5xl">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-white/95 p-5 shadow-modal backdrop-blur-sm md:grid-cols-12 md:items-end md:gap-3 md:p-4"
      >
        <div className="col-span-2 md:col-span-3">
          <label className={labelBase}>Chi nhánh *</label>
          <select className={fieldBase} value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={labelBase} htmlFor="checkin">Nhận phòng *</label>
          <input type="date" id="checkin" className={fieldBase} value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelBase} htmlFor="checkout">Trả phòng *</label>
          <input type="date" id="checkout" className={fieldBase} value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelBase} htmlFor="adults">Người lớn *</label>
          <input type="number" id="adults" className={fieldBase} value={adults} min={1} step={1} inputMode="numeric" onChange={(e) => setAdults(e.target.value)} />
        </div>

        <div className="md:col-span-1">
          <label className={labelBase} htmlFor="children">Trẻ em</label>
          <input type="number" id="children" className={fieldBase} value={children} min={0} step={1} inputMode="numeric" onChange={(e) => setChildren(e.target.value)} />
        </div>

        <div className="col-span-2 md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-sm bg-gold px-5 py-3 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover"
          >
            Đặt phòng
          </button>
        </div>
      </form>
      {err && (
        <div className="mt-3 rounded-sm bg-red-600/90 px-4 py-2 text-center text-sm text-white shadow-raised">
          {err}
        </div>
      )}
    </div>
  )
}

export default BookingForm
