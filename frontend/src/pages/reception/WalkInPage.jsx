import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService, vnd } from '../../services'

export default function WalkInPage() {
  const [roomTypes, setRoomTypes] = useState([])
  const [form, setForm] = useState({ roomTypeId: '', guestName: '', guestPhone: '', checkIn: '', checkOut: '', adults: 1, children: 0 })
  const [err, setErr] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    bookingService.listRooms().then((rooms) => {
      const map = {}
      rooms.forEach((r) => { if (r.roomType) map[r.roomType._id] = r.roomType })
      setRoomTypes(Object.values(map))
    }).catch(() => {})
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      const b = await bookingService.walkIn({ ...form, adults: Number(form.adults), children: Number(form.children) })
      nav(`/reception/bookings/${b._id}`)
    } catch (e2) { setErr(e2.response?.data?.message || 'Lỗi') }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Tạo booking tại quầy (Walk-in)</h2>
      <form onSubmit={submit} className="rc-form">
        <label>Loại phòng
          <select required value={form.roomTypeId} onChange={(e) => set('roomTypeId', e.target.value)}>
            <option value="">-- chọn --</option>
            {roomTypes.map((rt) => <option key={rt._id} value={rt._id}>{rt.name} ({vnd(rt.basePrice)}/đêm)</option>)}
          </select>
        </label>
        <label>Tên khách<input required value={form.guestName} onChange={(e) => set('guestName', e.target.value)} /></label>
        <label>SĐT<input value={form.guestPhone} onChange={(e) => set('guestPhone', e.target.value)} /></label>
        <label>Nhận phòng<input required type="date" value={form.checkIn} onChange={(e) => set('checkIn', e.target.value)} /></label>
        <label>Trả phòng<input required type="date" value={form.checkOut} onChange={(e) => set('checkOut', e.target.value)} /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>Người lớn<input type="number" min={1} value={form.adults} onChange={(e) => set('adults', e.target.value)} /></label>
          <label style={{ flex: 1 }}>Trẻ em<input type="number" min={0} value={form.children} onChange={(e) => set('children', e.target.value)} /></label>
        </div>
        {err && <p className="rc-err">{err}</p>}
        <button>Tạo booking</button>
      </form>
    </div>
  )
}
