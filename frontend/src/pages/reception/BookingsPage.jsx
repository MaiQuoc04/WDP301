import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService, vnd, fmtDateTime, bookingStatusLabel } from '../../services'
import { socket, connectSocket } from '../../services/socketService'

const STATUSES = ['', 'pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show']

// Mỗi dòng = 1 NHÓM đặt phòng (mọi lần đặt đều là nhóm, 1 phòng cũng vậy). Bấm vào xem các phòng chi tiết.
export default function BookingsPage() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    try { setList(await bookingService.listBookings({ status: status || undefined, q: q || undefined })) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải') }
  }, [status, q])
  useEffect(() => { load() }, [status]) // eslint-disable-line

  // Realtime: có booking đổi trạng thái / tạo mới -> làm mới danh sách (gộp nhiều sự kiện bằng debounce).
  const timerRef = useRef(null)
  useEffect(() => {
    connectSocket()
    const onEvt = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => load(), 400) }
    socket.on('booking_updated', onEvt)
    socket.on('new_booking', onEvt)
    return () => { socket.off('booking_updated', onEvt); socket.off('new_booking', onEvt); clearTimeout(timerRef.current) }
  }, [load])

  return (
    <div>
      <div className="rc-bar">
        <h2>Bookings</h2>
        <Link to="/reception/walk-in" className="rc-btn">+ Walk-in</Link>
      </div>
      <div className="rc-filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? bookingStatusLabel(s) : 'Tất cả trạng thái'}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã/tên/sđt"
          onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button onClick={load}>Tìm</button>
      </div>
      {err && <p className="rc-err">{err}</p>}
      <table className="rc-table">
        <thead><tr><th>Mã</th><th>Khách</th><th>Loại phòng</th><th>Phòng</th><th>Nhận</th><th>Trả</th><th>Trạng thái</th><th>Tổng</th><th></th></tr></thead>
        <tbody>
          {list.map((g) => {
            const rooms = g.roomNumbers || []
            const multi = (g.roomCount || rooms.length) > 1
            return (
              <tr key={g._id}>
                <td>
                  {g.code}
                  {multi && <span className="rc-pill" title="Đặt nhiều phòng"> · {g.roomCount} phòng</span>}
                </td>
                <td>{g.customer?.fullName || g.guestName}{g.source === 'online' && <small style={{ color: '#aaa' }}> · online</small>}</td>
                <td>{(g.roomTypeNames || []).join(', ')}</td>
                <td>{rooms.length ? <strong>{rooms.join(', ')}</strong> : <span style={{ color: '#aaa' }}>—</span>}</td>
                <td>{fmtDateTime(g.checkIn)}</td>
                <td>{fmtDateTime(g.checkOut)}</td>
                <td><span className={'rc-badge s-' + g.status}>{bookingStatusLabel(g.status)}</span></td>
                <td>{vnd(g.totalAmount)}</td>
                <td><Link to={`/reception/booking-groups/${g._id}`}>Chi tiết</Link></td>
              </tr>
            )
          })}
          {!list.length && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888' }}>Không có booking</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
