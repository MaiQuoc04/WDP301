import { useEffect, useState } from 'react'
import { bookingService, fmtDate } from '../../services'

export default function SchedulePage() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { bookingService.schedule().then(setData).catch((e) => setErr(e.response?.data?.message || 'Lỗi')) }, [])
  if (err) return <p className="rc-err">{err}</p>
  if (!data) return <p>Đang tải...</p>
  return (
    <div>
      <h2>Lịch phòng ({fmtDate(data.from)} → {fmtDate(data.to)})</h2>
      <table className="rc-table">
        <thead><tr><th>Phòng</th><th>Loại</th><th>Trạng thái</th><th>Booking trong khoảng</th></tr></thead>
        <tbody>
          {data.rooms.map((r) => (
            <tr key={r._id}>
              <td>{r.roomNumber}</td>
              <td>{r.roomType?.name}</td>
              <td><span className={'rc-badge st-' + r.status}>{r.status}</span></td>
              <td>{r.bookings.map((b) => `${b.code} (${fmtDate(b.checkIn)}→${fmtDate(b.checkOut)})`).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
