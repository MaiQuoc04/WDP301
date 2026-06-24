import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService, vnd, fmtDateTime } from '../../services'

const STATUSES = ['', 'pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show']

export default function BookingsPage() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    setErr('')
    try { setList(await bookingService.listBookings({ status: status || undefined, q: q || undefined })) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải') }
  }
  useEffect(() => { load() }, [status]) // eslint-disable-line

  return (
    <div>
      <div className="rc-bar">
        <h2>Bookings</h2>
        <Link to="/reception/walk-in" className="rc-btn">+ Walk-in</Link>
      </div>
      <div className="rc-filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'Tất cả trạng thái'}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã/tên/sđt"
          onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button onClick={load}>Tìm</button>
      </div>
      {err && <p className="rc-err">{err}</p>}
      <table className="rc-table">
        <thead><tr><th>Mã</th><th>Khách</th><th>Loại phòng</th><th>Phòng</th><th>Nhận</th><th>Trả</th><th>Trạng thái</th><th>Tổng</th><th></th></tr></thead>
        <tbody>
          {list.map((b) => (
            <tr key={b._id}>
              <td>{b.code}</td>
              <td>{b.customer?.fullName || b.guestName}</td>
              <td>{b.roomType?.name}</td>
              <td>{b.room?.roomNumber ? <strong>{b.room.roomNumber}</strong> : <span style={{ color: '#aaa' }}>—</span>}</td>
              <td>{fmtDateTime(b.checkIn)}</td>
              <td>{fmtDateTime(b.checkOut)}</td>
              <td><span className={'rc-badge s-' + b.status}>{b.status}</span></td>
              <td>{vnd(b.totalAmount)}</td>
              <td><Link to={`/reception/bookings/${b._id}`}>Chi tiết</Link></td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888' }}>Không có booking</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
