import { useCallback, useEffect, useRef, useState } from 'react'
import { bookingService } from '../../services'
import { socket, connectSocket } from '../../services/socketService'

const ROOM_STATUS_LABEL = {
  available: 'Trống', occupied: 'Đang ở', cleaning: 'Đang dọn', maintenance: 'Bảo trì', locked: 'Khoá',
}
const FILTERS = [
  ['', 'Tất cả'], ['available', 'Trống'], ['occupied', 'Đang ở'],
  ['cleaning', 'Đang dọn'], ['maintenance', 'Bảo trì'], ['locked', 'Khoá'],
]

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [err, setErr] = useState('')
  const [f, setF] = useState('')

  const load = useCallback(() => {
    bookingService.listRooms().then(setRooms).catch((e) => setErr(e.response?.data?.message || 'Lỗi'))
  }, [])
  useEffect(() => { load() }, [load])

  // Realtime: check-in/out/turnover đổi trạng thái phòng -> làm mới bảng (debounce gộp nhiều sự kiện).
  const timerRef = useRef(null)
  useEffect(() => {
    connectSocket()
    const onEvt = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(load, 400) }
    socket.on('booking_updated', onEvt)
    socket.on('new_booking', onEvt)
    return () => { socket.off('booking_updated', onEvt); socket.off('new_booking', onEvt); clearTimeout(timerRef.current) }
  }, [load])

  const cnt = (s) => rooms.filter((r) => r.status === s).length
  const shown = f ? rooms.filter((r) => r.status === f) : rooms

  return (
    <div>
      <div className="rc-bar">
        <h2>Phòng <small style={{ color: 'var(--rc-text-muted)', fontWeight: 500, fontSize: 14 }}>· {rooms.length} phòng</small></h2>
        <div className="rc-filters" style={{ margin: 0 }}>
          <select value={f} onChange={(e) => setF(e.target.value)}>
            {FILTERS.map(([v, label]) => (
              <option key={v} value={v}>{label} ({v ? cnt(v) : rooms.length})</option>
            ))}
          </select>
        </div>
      </div>
      {err && <p className="rc-err">{err}</p>}

      <div className="rooms-grid">
        {shown.map((r) => (
          <div key={r._id} className={'room-card-box st-' + r.status}>
            <div className="room-box-header">
              <span className="room-box-number">{r.roomNumber}</span>
              <span className="room-box-badge">{ROOM_STATUS_LABEL[r.status] || r.status}</span>
            </div>
            <div className="room-box-type">{r.roomType?.name || ''}</div>
            {r.awaitingRestock && <div style={{ fontSize: 11, color: '#d97706', marginTop: 4, fontWeight: 600 }}>⚠ chờ bổ sung đồ</div>}
          </div>
        ))}
        {!shown.length && <p style={{ color: '#888' }}>Không có phòng.</p>}
      </div>
    </div>
  )
}
