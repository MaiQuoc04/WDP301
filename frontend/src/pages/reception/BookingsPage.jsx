import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService, vnd, fmtDateTime, bookingStatusLabel, mixedSummary } from '../../services'
import { socket, connectSocket } from '../../services/socketService'

// Tab "Đặt phòng": các trạng thái đang hoạt động (gồm cả chờ cọc; huỷ/no-show ở tab riêng).
const ACTIVE_STATUSES = ['', 'pending', 'confirmed', 'checked_in', 'checked_out', 'completed']

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
        <div className="rc-bar-titles">
          <h2>Đặt phòng</h2>
          <p className="rc-sub">Mỗi dòng là một lần đặt (một mã, một cọc) — kể cả khi khách thuê nhiều phòng.</p>
        </div>
        <Link to="/reception/walk-in" className="rc-btn">+ Tạo tại quầy (Walk-in)</Link>
      </div>

      <div className="rc-tabs">
        <button className={'rc-tab' + (tab === 'active' ? ' on' : '')} onClick={() => switchTab('active')}>Đặt phòng</button>
        <button className={'rc-tab' + (tab === 'archived' ? ' on' : '')} onClick={() => switchTab('archived')}>Đã huỷ / No-show</button>
      </div>

      <div className="rc-filters card">
        {tab === 'active' && (
          <>
            <span className="rc-filters-label">Trạng thái:</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {ACTIVE_STATUSES.map((s) => <option key={s} value={s}>{s ? bookingStatusLabel(s) : 'Tất cả trạng thái'}</option>)}
            </select>
          </>
        )}
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã / tên / số điện thoại"
          onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button onClick={load}>Tìm</button>
      </div>
      {err && <p className="rc-err">{err}</p>}
      <table className="rc-table">
        <thead><tr>
          <th>Mã đặt phòng</th><th>Khách</th><th>Loại phòng</th><th>Phòng</th><th>Nhận / Trả</th>
          <th>Trạng thái</th><th className="rc-num">Tổng</th><th></th>
        </tr></thead>
        <tbody>
          {list.map((g) => {
            const rooms = g.roomNumbers || []
            const multi = (g.roomCount || rooms.length) > 1
            return (
              <tr key={g._id}>
                <td>
                  <b>{g.code}</b>
                  {multi && <><br /><span className="rc-pill" title="Đặt nhiều phòng">{g.roomCount} phòng</span></>}
                </td>
                <td>
                  {g.customer?.fullName || g.guestName}
                  <br /><small>{g.source === 'online' ? 'online' : 'tại quầy'}</small>
                </td>
                <td>{(g.roomTypeNames || []).join(', ')}</td>
                <td>{rooms.length ? <strong className="rc-rooms-cell">{rooms.join(', ')}</strong> : <span className="rc-muted">—</span>}</td>
                {/* Gộp Nhận/Trả 1 cột: hai mốc luôn được đọc cùng nhau, tách ra chỉ tốn ngang */}
                <td className="rc-num" style={{ textAlign: 'left' }}>{fmtDateTime(g.checkIn)}<br /><small>→ {fmtDateTime(g.checkOut)}</small></td>
                <td>
                  <span className={'rc-badge s-' + g.status}>{bookingStatusLabel(g.status)}</span>
                  {/* Nhóm lệch pha: status chỉ là pha CHÍNH -> phải nói rõ không phải phòng nào cũng vậy */}
                  {g.mixed && <span className="rc-badge s-mixed" style={{ marginLeft: 4 }} title={mixedSummary(g)}>Hỗn hợp</span>}
                  {g.mixed && <small className="rc-badge-note mixed">{mixedSummary(g)}</small>}
                  {!g.mixed && g.status === 'pending' && (
                    <small className="rc-badge-note warn">
                      {g.source === 'online' ? 'chờ khách thanh toán' : 'cần thu cọc'}
                    </small>
                  )}
                </td>
                <td className="rc-num"><b>{vnd(g.totalAmount)}</b></td>
                <td><Link to={`/reception/booking-groups/${g._id}`}>Chi tiết →</Link></td>
              </tr>
            )
          })}
          {!list.length && <tr><td colSpan={8} className="rc-empty">
            {tab === 'archived' ? 'Không có đơn đã huỷ / no-show' : 'Không có booking'}
          </td></tr>}
        </tbody>
      </table>
    </div>
  )
}
