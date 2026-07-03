import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService, vnd, fmtDateTime, bookingStatusLabel } from '../../services'
import { socket, connectSocket } from '../../services/socketService'

// Tab "Đặt phòng": các trạng thái đang hoạt động. Bỏ "Chờ cọc" khỏi bộ lọc (online chờ cọc đã ẩn;
// walk-in chờ cọc chỉ thoáng qua trước khi thu cọc nên lọc gần như không ra) — vẫn hiện ở "Tất cả".
const ACTIVE_STATUSES = ['', 'confirmed', 'checked_in', 'checked_out', 'completed']

const tabBtn = (on) => ({
  padding: '8px 18px', borderRadius: 8, border: '1px solid ' + (on ? 'var(--rc-gold, #b08d57)' : '#e5e5e5'),
  background: on ? 'var(--rc-gold, #b08d57)' : '#fff', color: on ? '#fff' : '#555',
  fontWeight: 600, fontSize: 14, cursor: 'pointer',
})

// Mỗi dòng = 1 NHÓM đặt phòng. Tab "Đặt phòng" (đang hoạt động) và tab "Đã huỷ / No-show" (tra cứu).
export default function BookingsPage() {
  const [tab, setTab] = useState('active') // 'active' | 'archived'
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    try { setList(await bookingService.listBookings({ status: status || undefined, q: q || undefined, view: tab })) }
    catch (e) { setErr(e.response?.data?.message || 'Lỗi tải') }
  }, [status, q, tab])
  useEffect(() => { load() }, [status, tab]) // eslint-disable-line

  const switchTab = (t) => { if (t !== tab) { setTab(t); setStatus('') } }

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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={tabBtn(tab === 'active')} onClick={() => switchTab('active')}>Đặt phòng</button>
        <button style={tabBtn(tab === 'archived')} onClick={() => switchTab('archived')}>Đã huỷ / No-show</button>
      </div>

      <div className="rc-filters">
        {tab === 'active' && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {ACTIVE_STATUSES.map((s) => <option key={s} value={s}>{s ? bookingStatusLabel(s) : 'Tất cả trạng thái'}</option>)}
          </select>
        )}
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
          {!list.length && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#888' }}>
            {tab === 'archived' ? 'Không có đơn đã huỷ / no-show' : 'Không có booking'}
          </td></tr>}
        </tbody>
      </table>
    </div>
  )
}
